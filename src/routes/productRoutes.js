/**
 * Product Routes
 * Маршрутизація для товарів
 * 
 * Базовий шлях: /api/products (для захищених роутів)
 * Публічний шлях: /api/websites/:websiteId/products
 * 
 * Формат: Functions (не Classes!)
 * Відповідальність: Тільки маршрутизація + middleware chain
 */

import express from 'express';
import ProductController from '../controllers/ProductController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
    createProductSchema,
    updateProductSchema,
    productIdSchema,
    websiteIdParamSchema,
    productQuerySchema,
    bulkUpdateOrderSchema
} from '../validators/productValidator.js';

const router = express.Router();

// Ініціалізуємо контролер
const productController = new ProductController();

// ============================================
// PUBLIC ROUTES (без authMiddleware)
// ============================================

/**
 * @route   GET /api/websites/:websiteId/products
 * @desc    Отримати products сайту (публічний доступ)
 * @access  Public
 * @params  websiteId - Website ID
 * @query   isAvailable, minPrice, maxPrice, currency, page, limit, sortBy, sortOrder
 */
router.get(
    '/websites/:websiteId/products',
    validateParams(websiteIdParamSchema),
    validateQuery(productQuerySchema),
    productController.getWebsiteProducts
);

// ============================================
// PROTECTED ROUTES (з authMiddleware)
// ============================================

/**
 * @route   GET /api/products/:id
 * @desc    Отримати один product по ID
 * @access  Private
 * @params  id - Product ID
 */
router.get(
    '/:id',
    authMiddleware,
    validateParams(productIdSchema),
    productController.getProductById
);

/**
 * @route   POST /api/products
 * @desc    Створити новий product
 * @access  Private
 * @body    websiteId (required), name (required), price (required),
 *          description, currency, isAvailable, order
 * @file    image (optional) - multipart/form-data
 */
router.post(
    '/',
    authMiddleware,
    uploadSingle('image'), // Multer middleware для завантаження product image
    validateBody(createProductSchema),
    productController.createProduct
);

/**
 * @route   PATCH /api/products/:id
 * @desc    Оновити product
 * @access  Private
 * @params  id - Product ID
 * @body    name, description, price, currency, isAvailable, order
 * @file    image (optional) - multipart/form-data
 */
router.patch(
    '/:id',
    authMiddleware,
    validateParams(productIdSchema),
    uploadSingle('image'), // Multer middleware для оновлення product image
    validateBody(updateProductSchema),
    productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Видалити product
 * @access  Private
 * @params  id - Product ID
 */
router.delete(
    '/:id',
    authMiddleware,
    validateParams(productIdSchema),
    productController.deleteProduct
);

/**
 * @route   PATCH /api/products/bulk-order
 * @desc    Масове оновлення порядку products (для drag-and-drop)
 * @access  Private
 * @body    websiteId (required), orders: [{ productId, order }, ...]
 */
router.patch(
    '/bulk-order',
    authMiddleware,
    validateBody(bulkUpdateOrderSchema),
    productController.bulkUpdateOrder
);

/**
 * @route   PATCH /api/products/:id/toggle-availability
 * @desc    Перемкнути доступність товару
 * @access  Private
 * @params  id - Product ID
 */
router.patch(
    '/:id/toggle-availability',
    authMiddleware,
    validateParams(productIdSchema),
    productController.toggleAvailability
);

// ============================================
// EXPORT
// ============================================

export default router;