/**
 * WebsiteService
 * Бізнес-логіка для роботи з сайтами
 */

import Website from '../models/Website.js';
import Product from '../models/Product.js';
import Business from '../models/Business.js';
import S3Service from './S3Service.js';
import { logInfo, logSuccess, logError, logWarn } from '../utils/logger.js';
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
    ForbiddenError
} from '../utils/errorHandler.js';
import { MVP_LIMITS, WEBSITE_TYPE, WEBSITE_STATUS } from '../config/constants.js';

class WebsiteService {
    constructor() {
        // Dependency Injection
        this.s3Service = new S3Service();
    }

    // ============================================
    // CRUD ОПЕРАЦІЇ
    // ============================================

    /**
     * Отримати всі websites користувача через його businesses
     * 
     * @param {String} userId - ID користувача
     * @param {Object} options - Опції (filters, pagination, sort)
     * @returns {Promise<Object>} - { websites, pagination }
     */
    async getUserWebsites(userId, options = {}) {
        try {
            logInfo('Getting user websites', { userId });

            const {
                type,
                status,
                businessId,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                populate = false
            } = options;

            // Спочатку знайдемо всі businesses користувача
            const userBusinesses = await Business.find({
                userId,
                isActive: true
            }).select('_id');

            const businessIds = userBusinesses.map(b => b._id);

            if (businessIds.length === 0) {
                return {
                    websites: [],
                    pagination: {
                        total: 0,
                        page: Number(page),
                        limit: Number(limit),
                        pages: 0
                    }
                };
            }

            // Формуємо query
            const query = {
                businessId: { $in: businessIds },
                isActive: true
            };

            if (type) {
                query.type = type;
            }

            if (status) {
                query.status = status;
            }

            if (businessId) {
                query.businessId = businessId;
            }

            // Пагінація
            const skip = (page - 1) * limit;
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            // Виконуємо запити паралельно
            let websitesQuery = Website.find(query)
                .select('-__v')
                .sort(sort)
                .skip(skip)
                .limit(limit);

            // Populate businessId якщо потрібно
            if (populate) {
                websitesQuery = websitesQuery.populate('businessId', 'name slug logo');
            }

            const [websites, total] = await Promise.all([
                websitesQuery.lean(),
                Website.countDocuments(query)
            ]);

            logSuccess('User websites retrieved', {
                userId,
                count: websites.length,
                total
            });

            return {
                websites,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            logError('Failed to get user websites', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Отримати website по ID
     * 
     * @param {String} websiteId - ID сайту
     * @param {String} userId - ID користувача (для перевірки власника)
     * @param {Boolean} populateProducts - Чи завантажувати products
     * @returns {Promise<Object>} - Website
     */
    async getWebsiteById(websiteId, userId, populateProducts = false) {
        try {
            logInfo('Getting website by ID', { websiteId, userId });

            // Знайти website
            let query = Website.findOne({
                _id: websiteId,
                isActive: true
            }).populate('businessId', 'name slug logo userId');

            const website = await query;

            if (!website) {
                throw new NotFoundError('Сайт не знайдено');
            }

            // Перевірка власника
            if (website.businessId.userId.toString() !== userId) {
                logWarn('Unauthorized website access attempt', {
                    websiteId,
                    userId,
                    ownerId: website.businessId.userId
                });
                throw new ForbiddenError('У вас немає доступу до цього сайту');
            }

            // Populate products якщо type='catalog' і потрібно
            if (populateProducts && website.type === WEBSITE_TYPE.CATALOG) {
                const products = await Product.find({
                    websiteId: website._id
                })
                    .sort({ order: 1 })
                    .select('-__v')
                    .lean();

                website.products = products;
            }

            logSuccess('Website retrieved', {
                websiteId,
                type: website.type
            });

            return website;

        } catch (error) {
            logError('Failed to get website by ID', {
                websiteId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Отримати website по slug (PUBLIC метод)
     * 
     * @param {String} slug - Slug сайту
     * @returns {Promise<Object>} - Website з products (якщо catalog)
     */
    async getWebsiteBySlug(slug) {
        try {
            logInfo('Getting website by slug (PUBLIC)', { slug });

            const website = await Website.findBySlug(slug);

            if (!website) {
                throw new NotFoundError('Сайт не знайдено або неактивний');
            }

            // Інкремент переглядів (асинхронно, без очікування)
            website.incrementViews().catch(err => {
                logError('Failed to increment views', {
                    websiteId: website._id,
                    error: err.message
                });
            });

            // Якщо catalog - завантажити products
            if (website.type === WEBSITE_TYPE.CATALOG) {
                const products = await Product.find({
                    websiteId: website._id,
                    isAvailable: true
                })
                    .sort({ order: 1 })
                    .select('-__v')
                    .lean();

                const websiteObj = website.toObject();
                websiteObj.products = products;

                logSuccess('Website retrieved by slug with products', {
                    slug,
                    productsCount: products.length
                });

                return websiteObj;
            }

            logSuccess('Website retrieved by slug', { slug });

            return website;

        } catch (error) {
            logError('Failed to get website by slug', {
                slug,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Створити новий website
     * 
     * @param {String} businessId - ID бізнесу
     * @param {String} userId - ID користувача
     * @param {Object} websiteData - Дані сайту
     * @param {Object} file - Файл cover image (від Multer)
     * @returns {Promise<Object>} - Створений website
     */
    async createWebsite(businessId, userId, websiteData, file) {
        try {
            logInfo('Creating website', { businessId, userId, type: websiteData.type });

            // 1. Перевірка що business належить userId
            const business = await Business.findOne({
                _id: businessId,
                userId,
                isActive: true
            });

            if (!business) {
                throw new NotFoundError('Бізнес не знайдено');
            }

            // 2. Перевірка MVP ліміту (1 website на business)
            const existingWebsites = await Website.countByBusinessId(businessId);

            if (existingWebsites >= MVP_LIMITS.MAX_WEBSITES_PER_BUSINESS) {
                throw new ConflictError(
                    `Досягнуто ліміт кількості сайтів для MVP (${MVP_LIMITS.MAX_WEBSITES_PER_BUSINESS})`
                );
            }

            // 3. Генерація slug
            const slug = await this.generateWebsiteSlug(businessId);

            // 4. Upload cover image (якщо є)
            let coverImageUrl = null;

            if (file) {
                coverImageUrl = await this.s3Service.uploadFile(file, 'covers');
                logSuccess('Cover image uploaded', { url: coverImageUrl });
            } else if (websiteData.type !== WEBSITE_TYPE.EXTERNAL) {
                // Cover image обов'язковий для card та catalog
                throw new BadRequestError('Cover image є обов\'язковим для card та catalog');
            }

            // 5. Створення website
            const website = await Website.create({
                businessId,
                type: websiteData.type,
                slug,
                metaTitle: websiteData.metaTitle,
                slogan: websiteData.slogan || '',
                description: websiteData.description || '',
                metaDescription: websiteData.metaDescription || '',
                coverImage: coverImageUrl,
                phone: websiteData.phone || null,
                email: websiteData.email || null,
                socialMedia: websiteData.socialMedia || {},
                externalUrl: websiteData.externalUrl || null,
                analyticsEnabled: websiteData.analyticsEnabled || false,
                status: websiteData.status || WEBSITE_STATUS.DRAFT
            });

            logSuccess('Website created', {
                websiteId: website._id,
                slug: website.slug,
                type: website.type
            });

            return website;

        } catch (error) {
            // Якщо помилка після upload - видалити файл
            if (file && error.name !== 'MulterError') {
                // TODO: Видалити файл з S3
            }

            logError('Failed to create website', {
                businessId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Оновити website
     * 
     * @param {String} websiteId - ID сайту
     * @param {String} userId - ID користувача
     * @param {Object} updateData - Дані для оновлення
     * @param {Object} file - Новий файл cover image (опціонально)
     * @returns {Promise<Object>} - Оновлений website
     */
    async updateWebsite(websiteId, userId, updateData, file) {
        try {
            logInfo('Updating website', { websiteId, userId });

            // 1. Перевірка власника
            const website = await this.getWebsiteById(websiteId, userId);

            // 2. Якщо новий cover image - видалити старий і upload новий
            if (file) {
                // Видалити старий cover
                if (website.coverImage) {
                    await this.s3Service.deleteFile(website.coverImage);
                    logInfo('Old cover image deleted', { url: website.coverImage });
                }

                // Upload новий
                const newCoverUrl = await this.s3Service.uploadFile(file, 'covers');
                updateData.coverImage = newCoverUrl;
                logSuccess('New cover image uploaded', { url: newCoverUrl });
            }

            // 3. Оновлення полів
            Object.assign(website, updateData);
            await website.save();

            logSuccess('Website updated', {
                websiteId,
                updatedFields: Object.keys(updateData)
            });

            return website;

        } catch (error) {
            logError('Failed to update website', {
                websiteId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Видалити website (soft delete)
     * 
     * @param {String} websiteId - ID сайту
     * @param {String} userId - ID користувача
     * @returns {Promise<Object>} - Success message
     */
    async deleteWebsite(websiteId, userId) {
        try {
            logInfo('Deleting website', { websiteId, userId });

            // 1. Перевірка власника
            const website = await this.getWebsiteById(websiteId, userId);

            // 2. Видалити cover image з S3
            if (website.coverImage) {
                await this.s3Service.deleteFile(website.coverImage);
                logInfo('Cover image deleted from S3', { url: website.coverImage });
            }

            // 3. Якщо catalog - видалити всі products та їх images
            if (website.type === WEBSITE_TYPE.CATALOG) {
                const products = await Product.find({ websiteId: website._id });

                for (const product of products) {
                    if (product.image) {
                        await this.s3Service.deleteFile(product.image);
                        logInfo('Product image deleted from S3', {
                            productId: product._id,
                            url: product.image
                        });
                    }
                    await product.deleteOne();
                }

                logInfo('All products deleted', {
                    websiteId,
                    count: products.length
                });
            }

            // 4. Soft delete website
            website.isActive = false;
            await website.save();

            // 5. Decrement Business.websitesCount (зробиться автоматично в pre-remove hook)
            // Але ми робимо soft delete, тому треба вручну
            await Business.findByIdAndUpdate(website.businessId, {
                $inc: { websitesCount: -1 }
            });

            logSuccess('Website deleted (soft delete)', { websiteId });

            return {
                message: 'Website successfully deleted'
            };

        } catch (error) {
            logError('Failed to delete website', {
                websiteId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // SLUG GENERATION
    // ============================================

    /**
     * Генерація унікального slug для website
     * Базується на business.slug + суфікс (-1, -2, ...) якщо потрібно
     * 
     * @param {String} businessId - ID бізнесу
     * @returns {Promise<String>} - Унікальний slug
     */
    async generateWebsiteSlug(businessId) {
        try {
            logInfo('Generating website slug', { businessId });

            // 1. Отримати business
            const business = await Business.findById(businessId);

            if (!business) {
                throw new NotFoundError('Бізнес не знайдено');
            }

            const baseSlug = business.slug;

            // 2. Перевірити чи існують websites з таким slug
            const existingWebsites = await Website.find({
                slug: new RegExp(`^${baseSlug}(-\\d+)?$`),
                isActive: true
            })
                .select('slug')
                .lean();

            // 3. Якщо немає жодного - повернути базовий slug
            if (existingWebsites.length === 0) {
                logSuccess('Base slug available', { slug: baseSlug });
                return baseSlug;
            }

            // 4. Знайти максимальний номер суфікса
            let maxSuffix = 0;

            existingWebsites.forEach(website => {
                if (website.slug === baseSlug) {
                    maxSuffix = Math.max(maxSuffix, 0);
                } else {
                    const match = website.slug.match(/-(\d+)$/);
                    if (match) {
                        const suffix = parseInt(match[1], 10);
                        maxSuffix = Math.max(maxSuffix, suffix);
                    }
                }
            });

            // 5. Повернути slug з наступним номером
            const newSlug = `${baseSlug}-${maxSuffix + 1}`;

            logSuccess('Website slug generated with suffix', {
                baseSlug,
                newSlug,
                suffix: maxSuffix + 1
            });

            return newSlug;

        } catch (error) {
            logError('Failed to generate website slug', {
                businessId,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // СТАТИСТИКА
    // ============================================

    /**
     * Отримати статистику website
     * 
     * @param {String} websiteId - ID сайту
     * @param {String} userId - ID користувача
     * @returns {Promise<Object>} - Статистика
     */
    async getWebsiteStats(websiteId, userId) {
        try {
            logInfo('Getting website stats', { websiteId, userId });

            // Перевірка власника
            const website = await this.getWebsiteById(websiteId, userId);

            const stats = {
                viewsCount: website.viewsCount,
                requestsCount: website.requestsCount,
                type: website.type,
                status: website.status
            };

            // Якщо catalog - додати кількість products
            if (website.type === WEBSITE_TYPE.CATALOG) {
                const productsCount = await Product.countByWebsiteId(websiteId);
                stats.productsCount = productsCount;
            }

            logSuccess('Website stats retrieved', { websiteId });

            return stats;

        } catch (error) {
            logError('Failed to get website stats', {
                websiteId,
                userId,
                error: error.message
            });
            throw error;
        }
    }
}

// ============================================
// EXPORT
// ============================================

export default WebsiteService;