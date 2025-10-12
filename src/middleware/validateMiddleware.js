/**
 * Validate Middleware
 * Валідація req.body, req.params, req.query через Joi схеми
 */

import { ValidationError } from '../utils/errorHandler.js';
import { logWarn } from '../utils/logger.js';

/**
 * Middleware для валідації даних через Joi
 * @param {Object} schema - Joi схема валідації
 * @param {String} source - Джерело даних ('body', 'params', 'query')
 */
const validateMiddleware = (schema, source = 'body') => {
    return (req, res, next) => {
        // Вибираємо джерело даних для валідації
        const dataToValidate = req[source];

        // Валідуємо дані
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false, // Показати всі помилки, не тільки першу
            stripUnknown: true // Видалити поля які не в схемі
        });

        // Якщо є помилки валідації
        if (error) {
            const errorDetails = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));

            logWarn('Validation failed', {
                source,
                errors: errorDetails,
                path: req.path
            });

            const validationError = new ValidationError(
                'Помилка валідації даних',
                errorDetails
            );

            return next(validationError);
        }

        // Замінюємо оригінальні дані на валідовані (з правильними типами)
        req[source] = value;

        next();
    };
};

/**
 * Helper для валідації body
 */
export const validateBody = (schema) => validateMiddleware(schema, 'body');

/**
 * Helper для валідації params
 */
export const validateParams = (schema) => validateMiddleware(schema, 'params');

/**
 * Helper для валідації query
 */
export const validateQuery = (schema) => validateMiddleware(schema, 'query');

export default validateMiddleware;