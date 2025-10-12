/**
 * Auth Routes
 * Маршрутизація для аутентифікації
 * 
 * Формат: Functions (не Classes!)
 * Відповідальність: Тільки маршрутизація
 */

import express from 'express';
import AuthController from '../controllers/AuthController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Ініціалізуємо контролер
const authController = new AuthController();

/**
 * @route   GET /api/auth/google
 * @desc    Ініціює Google OAuth flow, редіректить на Google
 * @access  Public
 */
router.get('/google', authController.googleAuth);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Callback endpoint для Google OAuth
 * @access  Public
 * @query   code - authorization code від Google
 */
router.get('/google/callback', authController.googleCallback);

/**
 * @route   GET /api/auth/me
 * @desc    Отримати інформацію про поточного користувача
 * @access  Private (потребує JWT token)
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout користувача
 * @access  Private (потребує JWT token)
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Оновити JWT токен (для майбутнього)
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

export default router;