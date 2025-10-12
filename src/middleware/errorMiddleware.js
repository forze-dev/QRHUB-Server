/**
 * Error Middleware
 * Глобальний обробник помилок для всього додатку
 */

import { logError } from '../utils/logger.js';
import {
    AppError,
    handleMongooseError,
    handleJWTError,
    isOperationalError
} from '../utils/errorHandler.js';

/**
 * Обробник помилок для development середовища
 */
const sendErrorDev = (err, res) => {
    logError('Development Error', {
        message: err.message,
        stack: err.stack,
        error: err
    });

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
        error: err,
        stack: err.stack
    });
};

/**
 * Обробник помилок для production середовища
 */
const sendErrorProd = (err, res) => {
    // Операційні помилки - показуємо користувачу
    if (isOperationalError(err)) {
        logError('Operational Error', {
            message: err.message,
            statusCode: err.statusCode
        });

        res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }
    // Програмні помилки - приховуємо деталі
    else {
        logError('Programming Error', {
            message: err.message,
            stack: err.stack
        });

        res.status(500).json({
            success: false,
            message: 'Щось пішло не так. Будь ласка, спробуйте пізніше.'
        });
    }
};

/**
 * Головний error middleware
 * Має бути останнім middleware в app.js
 */
const errorMiddleware = (err, req, res, next) => {
    // Встановлюємо statusCode за замовчуванням
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Обробка різних типів помилок
    let error = { ...err };
    error.message = err.message;

    // Mongoose помилки
    if (err.name === 'CastError' ||
        err.name === 'ValidationError' ||
        err.code === 11000) {
        error = handleMongooseError(err);
    }

    // JWT помилки
    if (err.name === 'JsonWebTokenError' ||
        err.name === 'TokenExpiredError') {
        error = handleJWTError(err);
    }

    // Joi validation помилки
    if (err.name === 'ValidationError' && err.isJoi) {
        error = new AppError(
            'Помилка валідації',
            422
        );
        error.errors = err.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
    }

    // Відправляємо відповідь залежно від середовища
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else {
        sendErrorProd(error, res);
    }
};

/**
 * Handler для неіснуючих роутів (404)
 */
export const notFoundMiddleware = (req, res, next) => {
    const error = new AppError(
        `Роут ${req.originalUrl} не знайдено`,
        404
    );
    next(error);
};

export default errorMiddleware;