/**
 * Scan Routes
 * Маршрутизація для публічних QR сканувань
 * 
 * Базовий шлях: /s
 * 
 * Формат: Functions (не Classes!)
 * Відповідальність: Тільки маршрутизація
 * 
 * ВАЖЛИВО: Ці роути PUBLIC - БЕЗ authMiddleware!
 */

import express from 'express';
import ScanController from '../controllers/ScanController.js';
import { validateParams } from '../middleware/validateMiddleware.js';
import { shortCodeSchema } from '../validators/qrcodeValidator.js';

const router = express.Router();

// Ініціалізуємо контролер
const scanController = new ScanController();

// ============================================
// PUBLIC ROUTES (без authMiddleware!)
// ============================================

/**
 * @route   GET /s/health
 * @desc    Health check для scan service
 * @access  Public
 */
router.get('/health', scanController.healthCheck);

/**
 * @route   GET /s/:shortCode
 * @desc    Сканування QR коду та redirect на targetUrl
 * @access  Public
 * @params  shortCode - Короткий код QR (наприклад: abc123)
 * 
 * Flow:
 * 1. Користувач сканує QR код камерою телефону
 * 2. QR містить URL: https://qrhub.online/s/abc123
 * 3. Backend обробляє запит:
 *    - Знаходить QR код по shortCode
 *    - Збирає device info (iOS/Android/Desktop)
 *    - Збирає geo info (країна/місто по IP)
 *    - Створює QRScan запис
 *    - Оновлює статистику QRCode
 * 4. Redirect 302 на targetUrl (сайт бізнесу)
 */
router.get(
    '/:shortCode',
    validateParams(shortCodeSchema),
    scanController.scanAndRedirect
);

/**
 * @route   GET /s/:shortCode/preview
 * @desc    Сканування з проміжною сторінкою (для майбутнього)
 * @access  Public
 * @params  shortCode - Короткий код QR
 * 
 * Використання:
 * - Показує інформацію про QR перед redirect
 * - Корисно для тестування
 * - Можна додати рекламу або аналітику
 */
router.get(
    '/:shortCode/preview',
    validateParams(shortCodeSchema),
    scanController.scanWithPreview
);

// ============================================
// EXPORT
// ============================================

export default router;