/**
 * Website Routes
 * Маршрутизація для сайтів
 * 
 * Базовий шлях: /api/websites
 * 
 * Формат: Functions (не Classes!)
 * Відповідальність: Тільки маршрутизація + middleware chain
 */

import express from 'express';
import WebsiteController from '../controllers/WebsiteController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
    createWebsiteSchema,
    updateWebsiteSchema,
    websiteIdSchema,
    websiteSlugSchema,
    websiteQuerySchema
} from '../validators/websiteValidator.js';

const router = express.Router();

// Ініціалізуємо контролер
const websiteController = new WebsiteController();

// ============================================
// PUBLIC ROUTES (без authMiddleware)
// ============================================

/**
 * @route   GET /api/websites/slug/:slug
 * @desc    Отримати website по slug (публічний доступ)
 * @access  Public
 */
router.get(
    '/slug/:slug',
    validateParams(websiteSlugSchema),
    websiteController.getWebsiteBySlug
);

// ============================================
// PROTECTED ROUTES (з authMiddleware)
// ============================================

/**
 * @route   GET /api/websites
 * @desc    Отримати всі websites користувача
 * @access  Private
 * @query   type, status, businessId, page, limit, sortBy, sortOrder, populate
 */
router.get(
    '/',
    authMiddleware,
    validateQuery(websiteQuerySchema),
    websiteController.getAllWebsites
);

/**
 * @route   GET /api/websites/:id
 * @desc    Отримати один website по ID
 * @access  Private
 * @params  id - Website ID
 * @query   populateProducts - Boolean (populate products для catalog)
 */
router.get(
    '/:id',
    authMiddleware,
    validateParams(websiteIdSchema),
    websiteController.getWebsiteById
);

/**
 * @route   POST /api/websites
 * @desc    Створити новий website
 * @access  Private
 * @body    businessId (required), type (required), metaTitle (required),
 *          slogan, description, metaDescription, phone, email, socialMedia,
 *          externalUrl, analyticsEnabled, status
 * @file    coverImage (optional) - multipart/form-data
 */
router.post(
    '/',
    authMiddleware,
    uploadSingle('coverImage'), // Multer middleware для завантаження cover image
    validateBody(createWebsiteSchema),
    websiteController.createWebsite
);

/**
 * @route   PATCH /api/websites/:id
 * @desc    Оновити website
 * @access  Private
 * @params  id - Website ID
 * @body    metaTitle, slogan, description, metaDescription, phone, email,
 *          socialMedia, externalUrl, analyticsEnabled, status
 * @file    coverImage (optional) - multipart/form-data
 */
router.patch(
    '/:id',
    authMiddleware,
    validateParams(websiteIdSchema),
    uploadSingle('coverImage'), // Multer middleware для оновлення cover image
    validateBody(updateWebsiteSchema),
    websiteController.updateWebsite
);

/**
 * @route   DELETE /api/websites/:id
 * @desc    Видалити website (soft delete)
 * @access  Private
 * @params  id - Website ID
 */
router.delete(
    '/:id',
    authMiddleware,
    validateParams(websiteIdSchema),
    websiteController.deleteWebsite
);

/**
 * @route   GET /api/websites/:id/stats
 * @desc    Отримати статистику website
 * @access  Private
 * @params  id - Website ID
 */
router.get(
    '/:id/stats',
    authMiddleware,
    validateParams(websiteIdSchema),
    websiteController.getWebsiteStats
);

// ============================================
// EXPORT
// ============================================

export default router;