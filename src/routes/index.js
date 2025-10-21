/**
 * Main Router
 * Головний роутер який об'єднує всі routes
 * 
 * Структура:
 * /api/auth       - Аутентифікація ✅
 * /api/businesses - Бізнеси ✅
 * /api/websites   - Сайти (для майбутнього)
 * /api/qrcodes    - QR коди (для майбутнього)
 * /api/analytics  - Аналітика (для майбутнього)
 * /api/requests   - Заявки (для майбутнього)
 */

import express from 'express';
import authRoutes from './authRoutes.js';
import businessRoutes from './businessRoutes.js';
import websiteRoutes from './websiteRoutes.js';
import productRoutes from './productRoutes.js';
import qrcodeRoutes from './qrcodeRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
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
// BUSINESS ROUTES
// ============================================
router.use('/businesses', businessRoutes);

// ============================================
// WEBSITES ROUTES
// ============================================
router.use('/websites', websiteRoutes);

// ============================================
// PRODUCTS ROUTES
// ============================================
router.use('/products', productRoutes);

// ============================================
// QRCODES ROUTES
// ============================================

router.use('/qrcodes', qrcodeRoutes);

// ============================================
// SCAN ROUTES (закоментовані поки не створені)
// ============================================
app.use('/scan', scanRoutes);

// ============================================
// FUTURE ROUTES (закоментовані поки не створені)
// ============================================
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