/**
 * Custom Error Handler
 * Кастомні класи помилок для різних сценаріїв
 */

/**
 * Базовий клас AppError
 * Всі кастомні помилки наслідують цей клас
 */
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 400 - Bad Request
 * Невірний запит від клієнта
 */
export class BadRequestError extends AppError {
    constructor(message = 'Невірний запит') {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}

/**
 * 401 - Unauthorized
 * Необхідна авторизація
 */
export class UnauthorizedError extends AppError {
    constructor(message = 'Необхідна авторизація') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

/**
 * 403 - Forbidden
 * Доступ заборонено
 */
export class ForbiddenError extends AppError {
    constructor(message = 'Доступ заборонено') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

/**
 * 404 - Not Found
 * Ресурс не знайдено
 */
export class NotFoundError extends AppError {
    constructor(message = 'Ресурс не знайдено') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

/**
 * 409 - Conflict
 * Конфлікт даних (наприклад, email вже існує)
 */
export class ConflictError extends AppError {
    constructor(message = 'Конфлікт даних') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

/**
 * 422 - Unprocessable Entity
 * Помилка валідації
 */
export class ValidationError extends AppError {
    constructor(message = 'Помилка валідації', errors = null) {
        super(message, 422);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

/**
 * 500 - Internal Server Error
 * Внутрішня помилка сервера
 */
export class InternalServerError extends AppError {
    constructor(message = 'Внутрішня помилка сервера') {
        super(message, 500);
        this.name = 'InternalServerError';
    }
}

/**
 * 503 - Service Unavailable
 * Сервіс недоступний
 */
export class ServiceUnavailableError extends AppError {
    constructor(message = 'Сервіс тимчасово недоступний') {
        super(message, 503);
        this.name = 'ServiceUnavailableError';
    }
}

/**
 * Helper функція для обробки async/await помилок
 * Обгортає async функцію та ловить помилки
 * 
 * @param {Function} fn - Async функція
 * @returns {Function} - Express middleware
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Перевіряє чи є помилка операційною (очікуваною)
 * @param {Error} error - Об'єкт помилки
 * @returns {Boolean}
 */
export const isOperationalError = (error) => {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
};

/**
 * Обробка помилок Mongoose
 * @param {Error} error - Mongoose error
 * @returns {AppError}
 */
export const handleMongooseError = (error) => {
    // Duplicate key error (E11000)
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const value = error.keyValue[field];
        return new ConflictError(`${field} "${value}" вже існує`);
    }

    // Validation error
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return new ValidationError('Помилка валідації', errors);
    }

    // Cast error (invalid ID)
    if (error.name === 'CastError') {
        return new BadRequestError(`Невірний формат ${error.path}: ${error.value}`);
    }

    // За замовчуванням
    return new InternalServerError(error.message);
};

/**
 * Обробка помилок JWT
 * @param {Error} error - JWT error
 * @returns {AppError}
 */
export const handleJWTError = (error) => {
    if (error.name === 'JsonWebTokenError') {
        return new UnauthorizedError('Невалідний токен');
    }

    if (error.name === 'TokenExpiredError') {
        return new UnauthorizedError('Токен прострочений');
    }

    return new UnauthorizedError('Помилка авторизації');
};

// Default export
export default {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    InternalServerError,
    ServiceUnavailableError,
    catchAsync,
    isOperationalError,
    handleMongooseError,
    handleJWTError
};