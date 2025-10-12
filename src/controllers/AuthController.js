/**
 * AuthController
 * HTTP обробка запитів аутентифікації
 * 
 * Відповідальність:
 * - Приймає req, res
 * - Витягує дані з req (body, params, query)
 * - Викликає AuthService для бізнес-логіки
 * - Формує HTTP відповідь
 * 
 * НЕ робить:
 * - Бізнес-логіку
 * - Прямі запити до БД
 * - Складні обчислення
 */

import AuthService from '../services/AuthService.js';
import { success, error } from '../utils/responseFormatter.js';
import { logInfo, logError } from '../utils/logger.js';

class AuthController {
    constructor() {
        // Dependency Injection
        this.authService = new AuthService();
    }

    /**
     * GET /api/auth/google
     * Генерує URL для Google OAuth та редіректить користувача
     */
    googleAuth = async (req, res, next) => {
        try {
            logInfo('User initiating Google OAuth', {
                ip: req.ip,
                userAgent: req.get('user-agent')
            });

            // Отримуємо URL для Google OAuth
            const authUrl = this.authService.getGoogleAuthUrl();

            // Редіректимо користувача на Google
            res.redirect(authUrl);

        } catch (err) {
            logError('Error initiating Google OAuth', {
                error: err.message
            });
            next(err);
        }
    };

    /**
     * GET /api/auth/google/callback
     * Обробляє callback від Google після авторизації
     * Створює/логінить користувача, генерує JWT
     */
    googleCallback = async (req, res, next) => {
        try {
            // Отримуємо authorization code з query params
            const { code } = req.query;

            if (!code) {
                logError('Google callback without code');
                return error(res, 'Authorization code not provided', 400);
            }

            logInfo('Processing Google callback', {
                codeReceived: true
            });

            // Викликаємо сервіс для обробки callback
            const result = await this.authService.handleGoogleCallback(code);

            // Редіректимо на фронтенд з токеном
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            // const redirectUrl = `${frontendUrl}/auth/callback?token=${result.token}`;
            const redirectUrl = `${frontendUrl}?token=${result.token}`;

            res.redirect(redirectUrl);

        } catch (err) {
            logError('Error in Google callback', {
                error: err.message,
                stack: err.stack
            });

            // Редіректимо на фронтенд з помилкою
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            // const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(err.message)}`;
            const errorUrl = `${frontendUrl}?message=${encodeURIComponent(err.message)}`;

            res.redirect(errorUrl);
        }
    };

    /**
     * GET /api/auth/me
     * Отримує інформацію про поточного користувача
     * Потребує JWT токен в headers
     */
    getMe = async (req, res, next) => {
        try {
            // req.userId додається authMiddleware
            const userId = req.userId;

            logInfo('Getting current user info', { userId });

            // Отримуємо користувача через сервіс
            const user = await this.authService.getUserById(userId);

            return success(res, 'User retrieved successfully', { user });

        } catch (err) {
            logError('Error getting current user', {
                userId: req.userId,
                error: err.message
            });
            next(err);
        }
    };

    /**
     * POST /api/auth/logout
     * Logout користувача (для майбутнього - invalidate token)
     */
    logout = async (req, res, next) => {
        try {
            const userId = req.userId;

            logInfo('User logging out', { userId });

            // Викликаємо logout в сервісі
            await this.authService.logout(userId);

            return success(res, 'Logged out successfully');

        } catch (err) {
            logError('Error logging out', {
                userId: req.userId,
                error: err.message
            });
            next(err);
        }
    };

    /**
     * POST /api/auth/refresh (для майбутнього)
     * Оновлює JWT токен за допомогою refresh token
     */
    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return error(res, 'Refresh token is required', 400);
            }

            // TODO: Implement refresh token logic in AuthService
            // const result = await this.authService.refreshToken(refreshToken);

            return success(res, 'Token refreshed successfully', {
                message: 'Not implemented yet'
            });

        } catch (err) {
            logError('Error refreshing token', {
                error: err.message
            });
            next(err);
        }
    };
}

export default AuthController;