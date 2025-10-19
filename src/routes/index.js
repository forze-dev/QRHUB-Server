/**
 * Main Router
 * Головний роутер для всіх API endpoints
 * 
 * Базовий шлях: /api
 */

import express from 'express';
import authRoutes from './authRoutes.js';
import businessRoutes from './businessRoutes.js';
import websiteRoutes from './websiteRoutes.js';
import productRoutes from './productRoutes.js';

const router = express.Router();

// ============================================
// HEALTH CHECK
// ============================================

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'QRHub API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============================================
// API ROUTES
// ============================================

/**
 * Auth routes
 * /api/auth/*
 */
router.use('/auth', authRoutes);

/**
 * Business routes
 * /api/businesses/*
 */
router.use('/businesses', businessRoutes);

/**
 * Website routes
 * /api/websites/*
 */
router.use('/websites', websiteRoutes);

/**
 * Product routes
 * /api/products/*
 * /api/websites/:websiteId/products (публічний)
 */
router.use('/products', productRoutes);

// ============================================
// 404 HANDLER
// ============================================

/**
 * Catch-all для неіснуючих роутів
 */
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: [
            '/api/health',
            '/api/auth/*',
            '/api/businesses/*',
            '/api/websites/*',
            '/api/products/*'
        ]
    });
});

// ============================================
// EXPORT
// ============================================

export default router;