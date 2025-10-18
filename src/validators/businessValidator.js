/**
 * Business Validators
 * Joi схеми для валідації даних бізнесу
 * 
 * Використовується в validateMiddleware для перевірки:
 * - req.body (createBusinessSchema, updateBusinessSchema)
 * - req.params (businessIdSchema)
 * - req.query (businessQuerySchema)
 */

import Joi from 'joi';
import { BUSINESS_STATUS, SLUG_RULES, CONTACT_VALIDATION } from '../config/constants.js';

// ============================================
// HELPER SCHEMAS (вкладені об'єкти)
// ============================================

/**
 * Схема для адреси
 */
const addressSchema = Joi.object({
    street: Joi.string().trim().max(200).allow('').optional(),
    city: Joi.string().trim().max(100).allow('').optional(),
    state: Joi.string().trim().max(100).allow('').optional(),
    country: Joi.string().trim().max(100).allow('').optional(),
    zip: Joi.string().trim().max(20).allow('').optional()
}).optional();

/**
 * Схема для соціальних мереж
 */
const socialMediaSchema = Joi.object({
    instagram: Joi.string().trim().uri().max(255).allow('').optional(),
    facebook: Joi.string().trim().uri().max(255).allow('').optional(),
    website: Joi.string().trim().uri().max(255).allow('').optional(),
    linkedin: Joi.string().trim().uri().max(255).allow('').optional(),
    twitter: Joi.string().trim().uri().max(255).allow('').optional()
}).optional();

// ============================================
// CREATE BUSINESS SCHEMA
// ============================================

/**
 * Схема для створення бізнесу
 * POST /api/businesses
 * 
 * Required: name
 * Optional: description, phone, email, address, socialMedia
 */
export const createBusinessSchema = Joi.object({
    // Обов'язкові поля
    name: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.base': 'Business name must be a string',
            'string.empty': 'Business name is required',
            'string.min': 'Business name must be at least 3 characters',
            'string.max': 'Business name must not exceed 100 characters',
            'any.required': 'Business name is required'
        }),

    // Опціональні поля
    description: Joi.string()
        .trim()
        .max(500)
        .allow('')
        .optional()
        .messages({
            'string.max': 'Description must not exceed 500 characters'
        }),

    phone: Joi.string()
        .trim()
        .pattern(CONTACT_VALIDATION.PHONE.PATTERN)
        .min(CONTACT_VALIDATION.PHONE.MIN_LENGTH)
        .max(CONTACT_VALIDATION.PHONE.MAX_LENGTH)
        .allow(null)
        .optional()
        .messages({
            'string.pattern.base': 'Invalid phone number format. Use E.164 format (e.g., +380501234567)',
            'string.min': 'Phone number is too short',
            'string.max': 'Phone number is too long'
        }),

    email: Joi.string()
        .trim()
        .email()
        .lowercase()
        .max(255)
        .allow(null)
        .optional()
        .messages({
            'string.email': 'Invalid email format',
            'string.max': 'Email must not exceed 255 characters'
        }),

    address: addressSchema,

    socialMedia: socialMediaSchema

    // Поля які НЕ приймаємо від клієнта (генеруються на бекенді):
    // - slug (генерується з name)
    // - logo (завантажується через multipart/form-data, req.file)
    // - status (за замовчуванням 'active')
    // - creationPaid, creationFee (для MVP завжди true/10)
    // - userId (з req.userId через authMiddleware)
});

// ============================================
// UPDATE BUSINESS SCHEMA
// ============================================

/**
 * Схема для оновлення бізнесу
 * PATCH /api/businesses/:id
 * 
 * Всі поля опціональні (часткове оновлення)
 * Не можна оновити: userId, slug (генерується автоматично)
 */
export const updateBusinessSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .optional()
        .messages({
            'string.min': 'Business name must be at least 3 characters',
            'string.max': 'Business name must not exceed 100 characters'
        }),

    description: Joi.string()
        .trim()
        .max(500)
        .allow('')
        .optional()
        .messages({
            'string.max': 'Description must not exceed 500 characters'
        }),

    phone: Joi.string()
        .trim()
        .pattern(CONTACT_VALIDATION.PHONE.PATTERN)
        .min(CONTACT_VALIDATION.PHONE.MIN_LENGTH)
        .max(CONTACT_VALIDATION.PHONE.MAX_LENGTH)
        .allow(null)
        .optional()
        .messages({
            'string.pattern.base': 'Invalid phone number format',
            'string.min': 'Phone number is too short',
            'string.max': 'Phone number is too long'
        }),

    email: Joi.string()
        .trim()
        .email()
        .lowercase()
        .max(255)
        .allow(null)
        .optional()
        .messages({
            'string.email': 'Invalid email format',
            'string.max': 'Email must not exceed 255 characters'
        }),

    address: addressSchema,

    socialMedia: socialMediaSchema,

    status: Joi.string()
        .valid(...Object.values(BUSINESS_STATUS))
        .optional()
        .messages({
            'any.only': `Status must be one of: ${Object.values(BUSINESS_STATUS).join(', ')}`
        })

    // Поля які НЕ можна оновити:
    // - userId (immutable)
    // - slug (оновлюється автоматично якщо змінили name)
    // - creationPaid, creationFee (immutable для MVP)
    // - лічильники (оновлюються автоматично)
})
    .min(1) // Мінімум одне поле має бути передано
    .messages({
        'object.min': 'At least one field must be provided for update'
    });

// ============================================
// PARAMS VALIDATION
// ============================================

/**
 * Схема для валідації MongoDB ObjectId в params
 * Використовується для :id параметрів
 */
export const businessIdSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid business ID format',
            'any.required': 'Business ID is required'
        })
});

/**
 * Схема для валідації slug в params
 * GET /api/businesses/slug/:slug
 */
export const businessSlugSchema = Joi.object({
    slug: Joi.string()
        .trim()
        .lowercase()
        .min(SLUG_RULES.MIN_LENGTH)
        .max(SLUG_RULES.MAX_LENGTH)
        .pattern(SLUG_RULES.PATTERN)
        .required()
        .messages({
            'string.pattern.base': 'Invalid slug format',
            'string.min': `Slug must be at least ${SLUG_RULES.MIN_LENGTH} characters`,
            'string.max': `Slug must not exceed ${SLUG_RULES.MAX_LENGTH} characters`,
            'any.required': 'Slug is required'
        })
});

// ============================================
// QUERY VALIDATION
// ============================================

/**
 * Схема для валідації query параметрів
 * GET /api/businesses?status=active&page=1&limit=10
 */
export const businessQuerySchema = Joi.object({
    // Фільтри
    status: Joi.string()
        .valid(...Object.values(BUSINESS_STATUS))
        .optional()
        .messages({
            'any.only': `Status must be one of: ${Object.values(BUSINESS_STATUS).join(', ')}`
        }),

    // Пагінація
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .optional()
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .optional()
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit must not exceed 100'
        }),

    // Сортування
    sortBy: Joi.string()
        .valid('createdAt', 'updatedAt', 'name')
        .default('createdAt')
        .optional()
        .messages({
            'any.only': 'Sort by must be one of: createdAt, updatedAt, name'
        }),

    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
        .optional()
        .messages({
            'any.only': 'Sort order must be either asc or desc'
        }),

    // Populate
    populate: Joi.boolean()
        .default(false)
        .optional()
        .messages({
            'boolean.base': 'Populate must be a boolean'
        })
});

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    createBusinessSchema,
    updateBusinessSchema,
    businessIdSchema,
    businessSlugSchema,
    businessQuerySchema
};