/**
 * Auth Middleware
 * Перевірка JWT токену та авторизація користувача
 */

import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errorHandler.js';
import { logWarn } from '../utils/logger.js';
import User from '../models/User.js';

/**
 * Middleware для перевірки JWT токену
 * Додає req.userId для наступних middleware/controllers
 */
const authMiddleware = async (req, res, next) => {
    try {
        // 1. Отримуємо token з headers
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logWarn('Auth attempt without token', {
                ip: req.ip,
                path: req.path
            });
            throw new UnauthorizedError('Токен не надано. Будь ласка, авторизуйтесь.');
        }

        // 2. Витягуємо token (видаляємо "Bearer ")
        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new UnauthorizedError('Токен не надано');
        }

        // 3. Верифікуємо token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Токен прострочений. Будь ласка, увійдіть знову.');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedError('Невалідний токен. Будь ласка, увійдіть знову.');
            }
            throw error;
        }

        // 4. Перевіряємо чи існує користувач
        const user = await User.findById(decoded.userId);

        if (!user) {
            logWarn('Token for non-existent user', {
                userId: decoded.userId
            });
            throw new UnauthorizedError('Користувача не знайдено');
        }

        // 5. Перевіряємо чи активний користувач
        if (!user.isActive) {
            logWarn('Token for inactive user', {
                userId: user._id,
                email: user.email
            });
            throw new UnauthorizedError('Акаунт деактивовано');
        }

        // 6. Додаємо userId до request
        req.userId = decoded.userId;
        req.user = user; // Додаємо весь об'єкт user для зручності

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional auth middleware
 * Не викидає помилку якщо токена немає, просто не додає req.userId
 * Використовується для роутів де авторизація опціональна
 */
export const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (user && user.isActive) {
            req.userId = decoded.userId;
            req.user = user;
        }

        next();
    } catch (error) {
        // Ігноруємо помилки токену для optional auth
        next();
    }
};

export default authMiddleware;