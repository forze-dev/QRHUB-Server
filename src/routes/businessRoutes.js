/**
 * Business Routes
 * Маршрутизація для бізнесів
 * 
 * Базовий шлях: /api/businesses
 * 
 * Формат: Functions (не Classes!)
 * Відповідальність: Тільки маршрутизація + middleware chain
 */

import express from 'express';
import BusinessController from '../controllers/BusinessController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
    createBusinessSchema,
    updateBusinessSchema,
    businessIdSchema,
    businessSlugSchema,
    businessQuerySchema
} from '../validators/businessValidator.js';

const router = express.Router();

// Ініціалізуємо контролер
const businessController = new BusinessController();

// ============================================
// PUBLIC ROUTES (без authMiddleware)
// ============================================

/**
 * @route   GET /api/businesses/slug/:slug
 * @desc    Отримати бізнес по slug (публічний доступ)
 * @access  Public
 */
router.get(
    '/slug/:slug',
    validateParams(businessSlugSchema),
    businessController.getBusinessBySlug
);

// ============================================
// PROTECTED ROUTES (з authMiddleware)
// ============================================

/**
 * @route   GET /api/businesses
 * @desc    Отримати всі бізнеси користувача
 * @access  Private
 * @query   status, page, limit, sortBy, sortOrder, populate
 */
router.get(
    '/',
    authMiddleware,
    validateQuery(businessQuerySchema),
    businessController.getAllBusinesses
);

/**
 * @route   GET /api/businesses/:id
 * @desc    Отримати один бізнес по ID
 * @access  Private
 * @params  id - Business ID
 * @query   populate - Boolean (populate websites and qrcodes)
 */
router.get(
    '/:id',
    authMiddleware,
    validateParams(businessIdSchema),
    businessController.getBusinessById
);

/**
 * @route   POST /api/businesses
 * @desc    Створити новий бізнес
 * @access  Private
 * @body    name (required), description, phone, email, address, socialMedia
 * @file    logo (optional) - multipart/form-data
 */
router.post(
    '/',
    authMiddleware,
    uploadSingle('logo'), // Multer middleware для завантаження logo
    validateBody(createBusinessSchema),
    businessController.createBusiness
);

/**
 * @route   PATCH /api/businesses/:id
 * @desc    Оновити бізнес
 * @access  Private
 * @params  id - Business ID
 * @body    name, description, phone, email, address, socialMedia, status (all optional)
 * @file    logo (optional) - multipart/form-data
 */
router.patch(
    '/:id',
    authMiddleware,
    uploadSingle('logo'), // Multer middleware для оновлення logo
    validateParams(businessIdSchema),
    validateBody(updateBusinessSchema),
    businessController.updateBusiness
);

/**
 * @route   DELETE /api/businesses/:id
 * @desc    Видалити бізнес (soft delete)
 * @access  Private
 * @params  id - Business ID
 */
router.delete(
    '/:id',
    authMiddleware,
    validateParams(businessIdSchema),
    businessController.deleteBusiness
);

/**
 * @route   GET /api/businesses/:id/stats
 * @desc    Отримати статистику бізнесу
 * @access  Private
 * @params  id - Business ID
 */
router.get(
    '/:id/stats',
    authMiddleware,
    validateParams(businessIdSchema),
    businessController.getBusinessStats
);

// ============================================
// EXPORT
// ============================================

export default router;