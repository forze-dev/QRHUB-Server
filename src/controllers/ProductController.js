/**
 * ProductController
 * HTTP обробка запитів для товарів
 * 
 * Відповідальність:
 * - Приймає req, res
 * - Витягує дані з req.body, req.params, req.query, req.file
 * - Викликає ProductService для бізнес-логіки
 * - Формує HTTP відповідь через responseFormatter
 */

import ProductService from '../services/ProductService.js';
import { success, created, noContent } from '../utils/responseFormatter.js';
import { logInfo, logError } from '../utils/logger.js';

class ProductController {
    constructor() {
        // Dependency Injection
        this.productService = new ProductService();
    }

    // ============================================
    // PUBLIC ENDPOINTS
    // ============================================

    /**
     * GET /api/websites/:websiteId/products
     * Отримати products сайту (публічний доступ)
     * 
     * Params:
     * - websiteId: Website ID
     * 
     * Query params:
     * - isAvailable: Boolean
     * - minPrice: Number
     * - maxPrice: Number
     * - currency: UAH|EUR|USD
     * - page: Number (default: 1)
     * - limit: Number (default: 10)
     * - sortBy: order|name|price|createdAt|updatedAt (default: 'order')
     * - sortOrder: asc|desc (default: 'asc')
     * 
     * @access Public (NO authMiddleware)
     */
    getWebsiteProducts = async (req, res, next) => {
        try {
            const { websiteId } = req.params; // З validateParams

            logInfo('Controller: Getting website products (PUBLIC)', {
                websiteId,
                query: req.query
            });

            // Витягуємо параметри з query
            const options = {
                isAvailable: req.query.isAvailable === 'true' ? true :
                    req.query.isAvailable === 'false' ? false : undefined,
                minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
                maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
                currency: req.query.currency,
                page: req.query.page,
                limit: req.query.limit,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            };

            // Викликаємо сервіс
            const result = await this.productService.getWebsiteProducts(
                websiteId,
                options
            );

            // Формуємо відповідь
            return success(res, 'Products retrieved successfully', result);

        } catch (error) {
            logError('Controller: Failed to get website products', {
                websiteId: req.params.websiteId,
                error: error.message
            });
            next(error);
        }
    };

    // ============================================
    // PROTECTED ENDPOINTS
    // ============================================

    /**
     * GET /api/products/:id
     * Отримати один product по ID
     * 
     * Params:
     * - id: Product ID
     * 
     * @access Private
     */
    getProductById = async (req, res, next) => {
        try {
            const { id } = req.params; // З validateParams
            const userId = req.userId;

            logInfo('Controller: Getting product by ID', {
                productId: id,
                userId
            });

            // Викликаємо сервіс
            const product = await this.productService.getProductById(id, userId);

            // Формуємо відповідь
            return success(res, 'Product retrieved successfully', product);

        } catch (error) {
            logError('Controller: Failed to get product', {
                productId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * POST /api/products
     * Створити новий product
     * 
     * Body:
     * - websiteId (required)
     * - name (required)
     * - price (required)
     * - description
     * - currency (default: 'UAH')
     * - isAvailable (default: true)
     * - order
     * 
     * File:
     * - image (optional, multipart/form-data)
     * 
     * @access Private
     */
    createProduct = async (req, res, next) => {
        try {
            const userId = req.userId;
            const productData = req.body; // З validateBody
            const file = req.file; // З uploadSingle('image')

            logInfo('Controller: Creating product', {
                userId,
                websiteId: productData.websiteId,
                name: productData.name
            });

            // Викликаємо сервіс
            const product = await this.productService.createProduct(
                productData.websiteId,
                userId,
                productData,
                file
            );

            // Формуємо відповідь (201 Created)
            return created(res, 'Product created successfully', product);

        } catch (error) {
            logError('Controller: Failed to create product', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * PATCH /api/products/:id
     * Оновити product
     * 
     * Params:
     * - id: Product ID
     * 
     * Body:
     * - name, description, price, currency
     * - isAvailable, order
     * 
     * File:
     * - image (optional, multipart/form-data)
     * 
     * @access Private
     */
    updateProduct = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const updateData = req.body; // З validateBody
            const file = req.file; // З uploadSingle('image')

            logInfo('Controller: Updating product', {
                productId: id,
                userId,
                fields: Object.keys(updateData)
            });

            // Викликаємо сервіс
            const product = await this.productService.updateProduct(
                id,
                userId,
                updateData,
                file
            );

            // Формуємо відповідь
            return success(res, 'Product updated successfully', product);

        } catch (error) {
            logError('Controller: Failed to update product', {
                productId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * DELETE /api/products/:id
     * Видалити product
     * 
     * Params:
     * - id: Product ID
     * 
     * @access Private
     */
    deleteProduct = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Deleting product', {
                productId: id,
                userId
            });

            // Викликаємо сервіс
            await this.productService.deleteProduct(id, userId);

            // Формуємо відповідь (204 No Content)
            return noContent(res);

        } catch (error) {
            logError('Controller: Failed to delete product', {
                productId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * PATCH /api/products/bulk-order
     * Масове оновлення порядку products
     * 
     * Body:
     * - websiteId (required)
     * - orders (required): [{ productId, order }, ...]
     * 
     * @access Private
     */
    bulkUpdateOrder = async (req, res, next) => {
        try {
            const userId = req.userId;
            const { websiteId, orders } = req.body; // З validateBody

            logInfo('Controller: Bulk updating product order', {
                userId,
                websiteId,
                count: orders.length
            });

            // Викликаємо сервіс
            const result = await this.productService.bulkUpdateOrder(
                websiteId,
                userId,
                orders
            );

            // Формуємо відповідь
            return success(res, 'Product order updated successfully', result);

        } catch (error) {
            logError('Controller: Failed to bulk update product order', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * PATCH /api/products/:id/toggle-availability
     * Перемкнути доступність товару
     * 
     * Params:
     * - id: Product ID
     * 
     * @access Private
     */
    toggleAvailability = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Toggling product availability', {
                productId: id,
                userId
            });

            // Викликаємо сервіс
            const product = await this.productService.toggleAvailability(id, userId);

            // Формуємо відповідь
            return success(res, 'Product availability toggled successfully', {
                productId: product._id,
                isAvailable: product.isAvailable
            });

        } catch (error) {
            logError('Controller: Failed to toggle product availability', {
                productId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };
}

// ============================================
// EXPORT
// ============================================

export default ProductController;