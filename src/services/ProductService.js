/**
 * ProductService
 * Бізнес-логіка для роботи з товарами
 */

import Product from '../models/Product.js';
import Website from '../models/Website.js';
import S3Service from './S3Service.js';
import { logInfo, logSuccess, logError, logWarn } from '../utils/logger.js';
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
    ForbiddenError
} from '../utils/errorHandler.js';
import { MVP_LIMITS, WEBSITE_TYPE } from '../config/constants.js';

class ProductService {
    constructor() {
        // Dependency Injection
        this.s3Service = new S3Service();
    }

    // ============================================
    // CRUD ОПЕРАЦІЇ
    // ============================================

    /**
     * Отримати products сайту (PUBLIC метод)
     * 
     * @param {String} websiteId - ID сайту
     * @param {Object} options - Опції (filters, pagination, sort)
     * @returns {Promise<Object>} - { products, pagination }
     */
    async getWebsiteProducts(websiteId, options = {}) {
        try {
            logInfo('Getting website products', { websiteId });

            const {
                isAvailable,
                minPrice,
                maxPrice,
                currency,
                page = 1,
                limit = 10,
                sortBy = 'order',
                sortOrder = 'asc'
            } = options;

            // Формуємо query
            const query = { websiteId };

            if (isAvailable !== undefined) {
                query.isAvailable = isAvailable;
            }

            if (minPrice !== undefined || maxPrice !== undefined) {
                query.price = {};
                if (minPrice !== undefined) query.price.$gte = minPrice;
                if (maxPrice !== undefined) query.price.$lte = maxPrice;
            }

            if (currency) {
                query.currency = currency.toUpperCase();
            }

            // Пагінація
            const skip = (page - 1) * limit;
            const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

            // Виконуємо запити паралельно
            const [products, total] = await Promise.all([
                Product.find(query)
                    .select('-__v')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Product.countDocuments(query)
            ]);

            logSuccess('Website products retrieved', {
                websiteId,
                count: products.length,
                total
            });

            return {
                products,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            logError('Failed to get website products', {
                websiteId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Отримати product по ID
     * 
     * @param {String} productId - ID товару
     * @param {String} userId - ID користувача (для перевірки власника)
     * @returns {Promise<Object>} - Product
     */
    async getProductById(productId, userId) {
        try {
            logInfo('Getting product by ID', { productId, userId });

            // Знайти product з website та business
            const product = await Product.findById(productId)
                .populate({
                    path: 'websiteId',
                    select: 'businessId type',
                    populate: {
                        path: 'businessId',
                        select: 'userId name'
                    }
                })
                .lean();

            if (!product) {
                throw new NotFoundError('Товар не знайдено');
            }

            // Перевірка власника
            if (product.websiteId.businessId.userId.toString() !== userId) {
                logWarn('Unauthorized product access attempt', {
                    productId,
                    userId,
                    ownerId: product.websiteId.businessId.userId
                });
                throw new ForbiddenError('У вас немає доступу до цього товару');
            }

            logSuccess('Product retrieved', { productId });

            return product;

        } catch (error) {
            logError('Failed to get product by ID', {
                productId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Створити новий product
     * 
     * @param {String} websiteId - ID сайту
     * @param {String} userId - ID користувача
     * @param {Object} productData - Дані товару
     * @param {Object} file - Файл image (від Multer)
     * @returns {Promise<Object>} - Створений product
     */
    async createProduct(websiteId, userId, productData, file) {
        try {
            logInfo('Creating product', { websiteId, userId });

            // 1. Валідація що website існує, належить userId та type='catalog'
            await this.validateWebsiteForProducts(websiteId, userId);

            // 2. Перевірка MVP ліміту (50 products на catalog)
            const existingProducts = await Product.countByWebsiteId(websiteId);

            if (existingProducts >= MVP_LIMITS.MAX_PRODUCTS_PER_CATALOG) {
                throw new ConflictError(
                    `Досягнуто ліміт кількості товарів для MVP (${MVP_LIMITS.MAX_PRODUCTS_PER_CATALOG})`
                );
            }

            // 3. Upload product image (якщо є)
            let imageUrl = null;

            if (file) {
                imageUrl = await this.s3Service.uploadFile(file, 'products');
                logSuccess('Product image uploaded', { url: imageUrl });
            }

            // 4. Якщо order не вказаний - взяти наступний
            let order = productData.order;
            if (order === undefined) {
                const maxOrder = await Product.getMaxOrder(websiteId);
                order = maxOrder + 1;
            }

            // 5. Створення product
            const product = await Product.create({
                websiteId,
                name: productData.name,
                description: productData.description || '',
                price: productData.price,
                currency: productData.currency || 'UAH',
                image: imageUrl,
                isAvailable: productData.isAvailable !== undefined ? productData.isAvailable : true,
                order
            });

            logSuccess('Product created', {
                productId: product._id,
                websiteId,
                name: product.name
            });

            return product;

        } catch (error) {
            // Якщо помилка після upload - видалити файл
            if (file && imageUrl) {
                await this.s3Service.deleteFile(imageUrl).catch(err => {
                    logError('Failed to cleanup uploaded image after error', {
                        url: imageUrl,
                        error: err.message
                    });
                });
            }

            logError('Failed to create product', {
                websiteId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Оновити product
     * 
     * @param {String} productId - ID товару
     * @param {String} userId - ID користувача
     * @param {Object} updateData - Дані для оновлення
     * @param {Object} file - Новий файл image (опціонально)
     * @returns {Promise<Object>} - Оновлений product
     */
    async updateProduct(productId, userId, updateData, file) {
        try {
            logInfo('Updating product', { productId, userId });

            // 1. Перевірка власника
            const product = await this.getProductById(productId, userId);

            // 2. Якщо новий image - видалити старий і upload новий
            if (file) {
                // Видалити старий image
                if (product.image) {
                    await this.s3Service.deleteFile(product.image);
                    logInfo('Old product image deleted', { url: product.image });
                }

                // Upload новий
                const newImageUrl = await this.s3Service.uploadFile(file, 'products');
                updateData.image = newImageUrl;
                logSuccess('New product image uploaded', { url: newImageUrl });
            }

            // 3. Оновлення полів
            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                updateData,
                { new: true, runValidators: true }
            );

            logSuccess('Product updated', {
                productId,
                updatedFields: Object.keys(updateData)
            });

            return updatedProduct;

        } catch (error) {
            logError('Failed to update product', {
                productId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Видалити product
     * 
     * @param {String} productId - ID товару
     * @param {String} userId - ID користувача
     * @returns {Promise<Object>} - Success message
     */
    async deleteProduct(productId, userId) {
        try {
            logInfo('Deleting product', { productId, userId });

            // 1. Перевірка власника
            const product = await this.getProductById(productId, userId);

            // 2. Видалити image з S3
            if (product.image) {
                await this.s3Service.deleteFile(product.image);
                logInfo('Product image deleted from S3', { url: product.image });
            }

            // 3. Видалити product з БД
            await Product.findByIdAndDelete(productId);

            logSuccess('Product deleted', { productId });

            return {
                message: 'Product successfully deleted'
            };

        } catch (error) {
            logError('Failed to delete product', {
                productId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Масове оновлення порядку products
     * Для drag-and-drop на фронтенді
     * 
     * @param {String} websiteId - ID сайту
     * @param {String} userId - ID користувача
     * @param {Array} orderData - Масив { productId, order }
     * @returns {Promise<Object>} - Success message
     */
    async bulkUpdateOrder(websiteId, userId, orderData) {
        try {
            logInfo('Bulk updating product order', {
                websiteId,
                userId,
                count: orderData.length
            });

            // 1. Валідація що website належить userId
            await this.validateWebsiteForProducts(websiteId, userId);

            // 2. Перевірка що всі products належать цьому website
            const productIds = orderData.map(item => item.productId);
            const products = await Product.find({
                _id: { $in: productIds },
                websiteId
            });

            if (products.length !== productIds.length) {
                throw new BadRequestError('Деякі товари не належать цьому сайту');
            }

            // 3. Масове оновлення через bulkWrite
            const bulkOps = orderData.map(item => ({
                updateOne: {
                    filter: { _id: item.productId },
                    update: { $set: { order: item.order } }
                }
            }));

            const result = await Product.bulkWrite(bulkOps);

            logSuccess('Product order updated', {
                websiteId,
                modified: result.modifiedCount
            });

            return {
                message: 'Product order successfully updated',
                modified: result.modifiedCount
            };

        } catch (error) {
            logError('Failed to bulk update product order', {
                websiteId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // ВАЛІДАЦІЯ
    // ============================================

    /**
     * Валідація що website існує, належить userId та type='catalog'
     * 
     * @param {String} websiteId - ID сайту
     * @param {String} userId - ID користувача
     * @returns {Promise<Object>} - Website
     */
    async validateWebsiteForProducts(websiteId, userId) {
        try {
            logInfo('Validating website for products', { websiteId, userId });

            // Знайти website з business
            const website = await Website.findOne({
                _id: websiteId,
                isActive: true
            }).populate('businessId', 'userId name');

            if (!website) {
                throw new NotFoundError('Сайт не знайдено');
            }

            // Перевірка власника
            if (website.businessId.userId.toString() !== userId) {
                logWarn('Unauthorized website access for products', {
                    websiteId,
                    userId,
                    ownerId: website.businessId.userId
                });
                throw new ForbiddenError('У вас немає доступу до цього сайту');
            }

            // Перевірка що type='catalog'
            if (website.type !== WEBSITE_TYPE.CATALOG) {
                throw new ConflictError('Товари можна додавати тільки до сайтів типу "catalog"');
            }

            logSuccess('Website validated for products', { websiteId });

            return website;

        } catch (error) {
            logError('Failed to validate website for products', {
                websiteId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // ДОПОМІЖНІ МЕТОДИ
    // ============================================

    /**
     * Перемкнути доступність товару
     * 
     * @param {String} productId - ID товару
     * @param {String} userId - ID користувача
     * @returns {Promise<Object>} - Оновлений product
     */
    async toggleAvailability(productId, userId) {
        try {
            logInfo('Toggling product availability', { productId, userId });

            // Перевірка власника
            await this.getProductById(productId, userId);

            // Знайти product і перемкнути
            const product = await Product.findById(productId);
            await product.toggleAvailability();

            logSuccess('Product availability toggled', {
                productId,
                isAvailable: product.isAvailable
            });

            return product;

        } catch (error) {
            logError('Failed to toggle product availability', {
                productId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Отримати кількість products для website
     * 
     * @param {String} websiteId - ID сайту
     * @returns {Promise<Number>} - Кількість товарів
     */
    async getProductsCount(websiteId) {
        try {
            const count = await Product.countByWebsiteId(websiteId);
            return count;
        } catch (error) {
            logError('Failed to get products count', {
                websiteId,
                error: error.message
            });
            throw error;
        }
    }
}

// ============================================
// EXPORT
// ============================================

export default ProductService;