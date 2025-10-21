/**
 * QR Code Validators
 * Joi схеми для валідації даних QR кодів
 * 
 * Використовується в validateMiddleware для перевірки:
 * - req.body (createQRCodeSchema, updateQRCodeSchema)
 * - req.params (qrcodeIdSchema)
 * - req.query (qrcodeQuerySchema)
 */

import Joi from 'joi';
import { QR_STATUS, QR_CODE_LIMITS } from '../config/constants.js';

// ============================================
// CREATE QR CODE SCHEMA
// ============================================

/**
 * Схема для створення QR коду
 * POST /api/qrcodes
 * 
 * Required: businessId, websiteId, name, targetUrl
 * Optional: description, primaryColor, backgroundColor
 */
export const createQRCodeSchema = Joi.object({
    // Обов'язкові поля
    businessId: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.base': 'Business ID має бути строкою',
            'string.empty': 'Business ID є обов\'язковим',
            'string.pattern.base': 'Невалідний формат Business ID',
            'any.required': 'Business ID є обов\'язковим'
        }),

    websiteId: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.base': 'Website ID має бути строкою',
            'string.empty': 'Website ID є обов\'язковим',
            'string.pattern.base': 'Невалідний формат Website ID',
            'any.required': 'Website ID є обов\'язковим'
        }),

    name: Joi.string()
        .trim()
        .min(QR_CODE_LIMITS.NAME.MIN_LENGTH)
        .max(QR_CODE_LIMITS.NAME.MAX_LENGTH)
        .required()
        .messages({
            'string.base': 'Назва має бути строкою',
            'string.empty': 'Назва є обов\'язковою',
            'string.min': `Назва має містити мінімум ${QR_CODE_LIMITS.NAME.MIN_LENGTH} символи`,
            'string.max': `Назва має містити максимум ${QR_CODE_LIMITS.NAME.MAX_LENGTH} символів`,
            'any.required': 'Назва є обов\'язковою'
        }),

    targetUrl: Joi.string()
        .trim()
        .uri()
        .max(QR_CODE_LIMITS.TARGET_URL.MAX_LENGTH)
        .required()
        .messages({
            'string.base': 'Target URL має бути строкою',
            'string.empty': 'Target URL є обов\'язковим',
            'string.uri': 'Target URL має бути валідним URL',
            'string.max': `Target URL має містити максимум ${QR_CODE_LIMITS.TARGET_URL.MAX_LENGTH} символів`,
            'any.required': 'Target URL є обов\'язковим'
        }),

    // Опціональні поля
    description: Joi.string()
        .trim()
        .max(QR_CODE_LIMITS.DESCRIPTION.MAX_LENGTH)
        .allow('')
        .optional()
        .messages({
            'string.max': `Опис має містити максимум ${QR_CODE_LIMITS.DESCRIPTION.MAX_LENGTH} символів`
        }),

    primaryColor: Joi.string()
        .trim()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Primary color має бути валідним hex кольором (наприклад: #000000)'
        }),

    backgroundColor: Joi.string()
        .trim()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Background color має бути валідним hex кольором (наприклад: #FFFFFF)'
        })
});

// ============================================
// UPDATE QR CODE SCHEMA
// ============================================

/**
 * Схема для оновлення QR коду
 * PATCH /api/qrcodes/:id
 * 
 * All fields optional
 */
export const updateQRCodeSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(QR_CODE_LIMITS.NAME.MIN_LENGTH)
        .max(QR_CODE_LIMITS.NAME.MAX_LENGTH)
        .optional()
        .messages({
            'string.min': `Назва має містити мінімум ${QR_CODE_LIMITS.NAME.MIN_LENGTH} символи`,
            'string.max': `Назва має містити максимум ${QR_CODE_LIMITS.NAME.MAX_LENGTH} символів`
        }),

    description: Joi.string()
        .trim()
        .max(QR_CODE_LIMITS.DESCRIPTION.MAX_LENGTH)
        .allow('')
        .optional()
        .messages({
            'string.max': `Опис має містити максимум ${QR_CODE_LIMITS.DESCRIPTION.MAX_LENGTH} символів`
        }),

    targetUrl: Joi.string()
        .trim()
        .uri()
        .max(QR_CODE_LIMITS.TARGET_URL.MAX_LENGTH)
        .optional()
        .messages({
            'string.uri': 'Target URL має бути валідним URL',
            'string.max': `Target URL має містити максимум ${QR_CODE_LIMITS.TARGET_URL.MAX_LENGTH} символів`
        }),

    primaryColor: Joi.string()
        .trim()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Primary color має бути валідним hex кольором'
        }),

    backgroundColor: Joi.string()
        .trim()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Background color має бути валідним hex кольором'
        }),

    status: Joi.string()
        .valid(...Object.values(QR_STATUS))
        .optional()
        .messages({
            'any.only': `Статус має бути одним з: ${Object.values(QR_STATUS).join(', ')}`
        })
}).min(1).messages({
    'object.min': 'Потрібно передати хоча б одне поле для оновлення'
});

// ============================================
// PARAMS VALIDATION
// ============================================

/**
 * Схема для валідації QR Code ID в params
 * GET/PATCH/DELETE /api/qrcodes/:id
 */
export const qrcodeIdSchema = Joi.object({
    id: Joi.string()
        .required()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.base': 'QR Code ID має бути строкою',
            'string.empty': 'QR Code ID є обов\'язковим',
            'string.pattern.base': 'Невалідний формат QR Code ID',
            'any.required': 'QR Code ID є обов\'язковим'
        })
});

/**
 * Схема для валідації shortCode в params
 * GET /s/:shortCode (для публічного redirect)
 */
export const shortCodeSchema = Joi.object({
    shortCode: Joi.string()
        .required()
        .min(6)
        .max(20)
        .pattern(/^[a-zA-Z0-9-]+$/)
        .messages({
            'string.base': 'Short code має бути строкою',
            'string.empty': 'Short code є обов\'язковим',
            'string.min': 'Short code має містити мінімум 6 символів',
            'string.max': 'Short code має містити максимум 20 символів',
            'string.pattern.base': 'Short code може містити тільки літери, цифри та дефіс',
            'any.required': 'Short code є обов\'язковим'
        })
});

// ============================================
// QUERY VALIDATION
// ============================================

/**
 * Схема для валідації query params
 * GET /api/qrcodes
 */
export const qrcodeQuerySchema = Joi.object({
    // Фільтри
    status: Joi.string()
        .valid(...Object.values(QR_STATUS))
        .optional()
        .messages({
            'any.only': `Статус має бути одним з: ${Object.values(QR_STATUS).join(', ')}`
        }),

    businessId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Невалідний формат Business ID'
        }),

    websiteId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Невалідний формат Website ID'
        }),

    // Пагінація
    page: Joi.number()
        .integer()
        .min(1)
        .optional()
        .messages({
            'number.base': 'Page має бути числом',
            'number.integer': 'Page має бути цілим числом',
            'number.min': 'Page має бути мінімум 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .messages({
            'number.base': 'Limit має бути числом',
            'number.integer': 'Limit має бути цілим числом',
            'number.min': 'Limit має бути мінімум 1',
            'number.max': 'Limit має бути максимум 100'
        }),

    // Сортування
    sortBy: Joi.string()
        .valid('createdAt', 'updatedAt', 'name', 'totalScans', 'status')
        .optional()
        .messages({
            'any.only': 'sortBy має бути одним з: createdAt, updatedAt, name, totalScans, status'
        }),

    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .optional()
        .messages({
            'any.only': 'sortOrder має бути asc або desc'
        })
});

/**
 * Схема для валідації download query params
 * GET /api/qrcodes/:id/download
 */
export const downloadQuerySchema = Joi.object({
    format: Joi.string()
        .valid('png', 'svg')
        .optional()
        .default('png')
        .messages({
            'any.only': 'Format має бути png або svg'
        })
});

// ============================================
// BULK OPERATIONS VALIDATION (для майбутнього)
// ============================================

/**
 * Схема для bulk create
 * POST /api/qrcodes/bulk-create
 */
export const bulkCreateQRCodesSchema = Joi.object({
    qrcodes: Joi.array()
        .items(createQRCodeSchema)
        .min(1)
        .max(50)
        .required()
        .messages({
            'array.base': 'QR codes має бути масивом',
            'array.min': 'Потрібно передати хоча б один QR код',
            'array.max': 'Можна створити максимум 50 QR кодів за раз',
            'any.required': 'QR codes є обов\'язковим'
        })
});

/**
 * Схема для bulk delete
 * DELETE /api/qrcodes/bulk-delete
 */
export const bulkDeleteQRCodesSchema = Joi.object({
    ids: Joi.array()
        .items(
            Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
        )
        .min(1)
        .max(50)
        .required()
        .messages({
            'array.base': 'IDs має бути масивом',
            'array.min': 'Потрібно передати хоча б один ID',
            'array.max': 'Можна видалити максимум 50 QR кодів за раз',
            'any.required': 'IDs є обов\'язковим',
            'string.pattern.base': 'Невалідний формат ID'
        })
});

// ============================================
// CUSTOM VALIDATION HELPERS
// ============================================

/**
 * Валідація hex кольору
 */
export const isValidHexColor = (color) => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
};

/**
 * Валідація URL
 */
export const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Валідація MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Валідація short code формату
 */
export const isValidShortCode = (code) => {
    return /^[a-zA-Z0-9-]+$/.test(code) && code.length >= 6 && code.length <= 20;
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    createQRCodeSchema,
    updateQRCodeSchema,
    qrcodeIdSchema,
    shortCodeSchema,
    qrcodeQuerySchema,
    downloadQuerySchema,
    bulkCreateQRCodesSchema,
    bulkDeleteQRCodesSchema,
    isValidHexColor,
    isValidUrl,
    isValidObjectId,
    isValidShortCode
};