/**
 * Response Formatter Utility
 * Стандартизований формат відповідей API
 * 
 * Формат згідно ТЗ:
 * {
 *   success: true/false,
 *   message: "Опис результату",
 *   data: { ... } // Необов'язково
 * }
 */

/**
 * Успішна відповідь
 * @param {Object} res - Express response object
 * @param {String} message - Повідомлення про успіх
 * @param {Object|Array} data - Дані для відповіді (необов'язково)
 * @param {Number} statusCode - HTTP статус код (за замовчуванням 200)
 */
export const success = (res, message, data = null, statusCode = 200) => {
    const response = {
        success: true,
        message
    };

    // Додаємо data тільки якщо він не null
    if (data !== null && data !== undefined) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Відповідь з помилкою
 * @param {Object} res - Express response object
 * @param {String} message - Повідомлення про помилку
 * @param {Number} statusCode - HTTP статус код (за замовчуванням 400)
 * @param {Object|Array} errors - Деталі помилок (необов'язково)
 */
export const error = (res, message, statusCode = 400, errors = null) => {
    const response = {
        success: false,
        message
    };

    // Додаємо errors тільки якщо вони є
    if (errors !== null && errors !== undefined) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Відповідь Created (201)
 * Використовується при створенні нового ресурсу
 */
export const created = (res, message, data = null) => {
    return success(res, message, data, 201);
};

/**
 * Відповідь No Content (204)
 * Використовується при успішному видаленні
 */
export const noContent = (res) => {
    return res.status(204).send();
};

/**
 * Відповідь Not Found (404)
 */
export const notFound = (res, message = 'Ресурс не знайдено') => {
    return error(res, message, 404);
};

/**
 * Відповідь Unauthorized (401)
 */
export const unauthorized = (res, message = 'Необхідна авторизація') => {
    return error(res, message, 401);
};

/**
 * Відповідь Forbidden (403)
 */
export const forbidden = (res, message = 'Доступ заборонено') => {
    return error(res, message, 403);
};

/**
 * Відповідь Bad Request (400)
 */
export const badRequest = (res, message = 'Невірний запит', errors = null) => {
    return error(res, message, 400, errors);
};

/**
 * Відповідь Internal Server Error (500)
 */
export const serverError = (res, message = 'Внутрішня помилка сервера') => {
    return error(res, message, 500);
};

/**
 * Відповідь Conflict (409)
 * Використовується при конфліктах (наприклад, email вже існує)
 */
export const conflict = (res, message = 'Конфлікт даних') => {
    return error(res, message, 409);
};

/**
 * Відповідь Validation Error (422)
 * Використовується при помилках валідації
 */
export const validationError = (res, message = 'Помилка валідації', errors = null) => {
    return error(res, message, 422, errors);
};

// Default export з усіма методами
export default {
    success,
    error,
    created,
    noContent,
    notFound,
    unauthorized,
    forbidden,
    badRequest,
    serverError,
    conflict,
    validationError
};