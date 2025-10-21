/**
 * QR Code Routes
 * Маршрутизація для QR кодів
 * 
 * Базовий шлях: /api/qrcodes
 * 
 * Формат: Functions (не Classes!)
 * Відповідальність: Тільки маршрутизація + middleware chain
 */

import express from 'express';
import QRCodeController from '../controllers/QRCodeController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateMiddleware.js';
import {
    createQRCodeSchema,
    updateQRCodeSchema,
    qrcodeIdSchema,
    qrcodeQuerySchema,
    downloadQuerySchema,
    bulkCreateQRCodesSchema,
    bulkDeleteQRCodesSchema
} from '../validators/qrcodeValidator.js';

const router = express.Router();

// Ініціалізуємо контролер
const qrcodeController = new QRCodeController();

// ============================================
// PROTECTED ROUTES (з authMiddleware)
// ============================================

/**
 * @route   GET /api/qrcodes
 * @desc    Отримати всі QR коди користувача
 * @access  Private
 * @query   status, businessId, websiteId, page, limit, sortBy, sortOrder
 */
router.get(
    '/',
    authMiddleware,
    validateQuery(qrcodeQuerySchema),
    qrcodeController.getAllQRCodes
);

/**
 * @route   GET /api/qrcodes/:id
 * @desc    Отримати один QR код по ID
 * @access  Private
 * @params  id - QR Code ID
 */
router.get(
    '/:id',
    authMiddleware,
    validateParams(qrcodeIdSchema),
    qrcodeController.getQRCodeById
);

/**
 * @route   POST /api/qrcodes
 * @desc    Створити новий QR код
 * @access  Private
 * @body    businessId (required), websiteId (required), name (required),
 *          targetUrl (required), description, primaryColor, backgroundColor
 */
router.post(
    '/',
    authMiddleware,
    validateBody(createQRCodeSchema),
    qrcodeController.createQRCode
);

/**
 * @route   PATCH /api/qrcodes/:id
 * @desc    Оновити QR код
 * @access  Private
 * @params  id - QR Code ID
 * @body    name, description, targetUrl, primaryColor, backgroundColor, status (all optional)
 */
router.patch(
    '/:id',
    authMiddleware,
    validateParams(qrcodeIdSchema),
    validateBody(updateQRCodeSchema),
    qrcodeController.updateQRCode
);

/**
 * @route   DELETE /api/qrcodes/:id
 * @desc    Видалити QR код (soft delete)
 * @access  Private
 * @params  id - QR Code ID
 */
router.delete(
    '/:id',
    authMiddleware,
    validateParams(qrcodeIdSchema),
    qrcodeController.deleteQRCode
);

// ============================================
// СПЕЦІАЛЬНІ ENDPOINTS
// ============================================

/**
 * @route   GET /api/qrcodes/:id/download
 * @desc    Завантажити QR код як файл
 * @access  Private
 * @params  id - QR Code ID
 * @query   format - png|svg (default: png)
 */
router.get(
    '/:id/download',
    authMiddleware,
    validateParams(qrcodeIdSchema),
    validateQuery(downloadQuerySchema),
    qrcodeController.downloadQRCode
);

/**
 * @route   POST /api/qrcodes/:id/regenerate
 * @desc    Регенерувати QR image
 * @access  Private
 * @params  id - QR Code ID
 */
router.post(
    '/:id/regenerate',
    authMiddleware,
    validateParams(qrcodeIdSchema),
    qrcodeController.regenerateQRImage
);

/**
 * @route   PATCH /api/qrcodes/:id/toggle
 * @desc    Перемкнути статус QR коду (active <-> inactive)
 * @access  Private
 * @params  id - QR Code ID
 */
router.patch(
    '/:id/toggle',
    authMiddleware,
    validateParams(qrcodeIdSchema),
    qrcodeController.toggleQRCodeStatus
);

/**
 * @route   PATCH /api/qrcodes/:id/activate
 * @desc    Активувати QR код
 * @access  Private
 * @params  id - QR Code ID
 */
router.patch(
    '/:id/activate',
    authMiddleware,
    validateParams(qrcodeIdSchema),
    qrcodeController.activateQRCode
);

/**
 * @route   PATCH /api/qrcodes/:id/deactivate
 * @desc    Деактивувати QR код
 * @access  Private
 * @params  id - QR Code ID
 */
router.patch(
    '/:id/deactivate',
    authMiddleware,
    validateParams(qrcodeIdSchema),
    qrcodeController.deactivateQRCode
);

/**
 * @route   GET /api/qrcodes/:id/stats
 * @desc    Отримати статистику QR коду
 * @access  Private
 * @params  id - QR Code ID
 */
router.get(
    '/:id/stats',
    authMiddleware,
    validateParams(qrcodeIdSchema),
    qrcodeController.getQRCodeStats
);

// ============================================
// BULK OPERATIONS (для майбутнього)
// ============================================

/**
 * @route   POST /api/qrcodes/bulk-create
 * @desc    Створити кілька QR кодів одночасно
 * @access  Private
 * @body    qrcodes: Array of QR code data
 */
router.post(
    '/bulk-create',
    authMiddleware,
    validateBody(bulkCreateQRCodesSchema),
    qrcodeController.bulkCreateQRCodes
);

/**
 * @route   DELETE /api/qrcodes/bulk-delete
 * @desc    Видалити кілька QR кодів одночасно
 * @access  Private
 * @body    ids: Array of QR code IDs
 */
router.delete(
    '/bulk-delete',
    authMiddleware,
    validateBody(bulkDeleteQRCodesSchema),
    qrcodeController.bulkDeleteQRCodes
);

// ============================================
// EXPORT
// ============================================

export default router;