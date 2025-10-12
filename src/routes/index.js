/**
 * Main Router
 * Головний роутер який об'єднує всі routes
 * 
 * Структура:
 * /api/auth       - Аутентифікація
 * /api/users      - Користувачі (для майбутнього)
 * /api/businesses - Бізнеси (для майбутнього)
 * /api/websites   - Сайти (для майбутнього)
 * /api/qrcodes    - QR коди (для майбутнього)
 * /api/analytics  - Аналітика (для майбутнього)
 * /api/requests   - Заявки (для майбутнього)
 */

import express from 'express';
import authRoutes from './authRoutes.js';
// import userRoutes from './userRoutes.js';
// import businessRoutes from './businessRoutes.js';
// import websiteRoutes from './websiteRoutes.js';
// import qrcodeRoutes from './qrcodeRoutes.js';
// import analyticsRoutes from './analyticsRoutes.js';
// import requestRoutes from './requestRoutes.js';

const router = express.Router();

/**
 * Health check endpoint
 * Перевірка що API працює
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'QRHub API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * API version info
 * Інформація про версію API
 */
router.get('/version', (req, res) => {
    res.status(200).json({
        success: true,
        version: '1.0.0',
        apiName: 'QRHub API',
        description: 'QR codes, websites and business analytics platform'
    });
});

// ============================================
// AUTH ROUTES
// ============================================
router.use('/auth', authRoutes);

// ============================================
// FUTURE ROUTES (закоментовані поки не створені)
// ============================================
// router.use('/users', userRoutes);
// router.use('/businesses', businessRoutes);
// router.use('/websites', websiteRoutes);
// router.use('/qrcodes', qrcodeRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/requests', requestRoutes);

/**
 * 404 handler для API routes
 * Якщо роут не знайдено
 */
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

export default router;