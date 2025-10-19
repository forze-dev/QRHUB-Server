/**
 * Website Validator
 * Joi схеми валідації для Website endpoints
 */

import Joi from 'joi';
import { WEBSITE_TYPE, WEBSITE_STATUS } from '../config/constants.js';

// ============================================
// HELPER SCHEMAS
// ============================================

// MongoDB ObjectId валідація
const objectIdSchema = Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .message('Invalid MongoDB ObjectId format');

// URL валідація
const urlSchema = Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .message('Invalid URL format');

// Телефон валідація (міжнародний формат)
const phoneSchema = Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .message('Invalid phone number format. Use international format: +380123456789');

// Email валідація
const emailSchema = Joi.string()
    .email()
    .message('Invalid email format');

// Slug валідація
const slugSchema = Joi.string()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .message('Slug can only contain lowercase letters, numbers and hyphens');

// ============================================
// CREATE WEBSITE SCHEMA
// ============================================

export const createWebsiteSchema = Joi.object({
    // Обов'язкові поля
    businessId: objectIdSchema.required()
        .messages({
            'any.required': 'Business ID is required',
            'string.empty': 'Business ID cannot be empty'
        }),

    type: Joi.string()
        .valid(...Object.values(WEBSITE_TYPE))
        .required()
        .messages({
            'any.required': 'Website type is required',
            'any.only': `Website type must be one of: ${Object.values(WEBSITE_TYPE).join(', ')}`
        }),

    metaTitle: Joi.string()
        .min(10)
        .max(60)
        .trim()
        .required()
        .messages({
            'any.required': 'Meta title is required',
            'string.min': 'Meta title must be at least 10 characters',
            'string.max': 'Meta title must not exceed 60 characters'
        }),

    // Опціональні поля
    slogan: Joi.string()
        .max(100)
        .trim()
        .allow('')
        .optional()
        .messages({
            'string.max': 'Slogan must not exceed 100 characters'
        }),

    description: Joi.string()
        .max(1000)
        .trim()
        .allow('')
        .optional()
        .messages({
            'string.max': 'Description must not exceed 1000 characters'
        }),

    metaDescription: Joi.string()
        .max(160)
        .trim()
        .allow('')
        .optional()
        .messages({
            'string.max': 'Meta description must not exceed 160 characters'
        }),

    // Контакти
    phone: phoneSchema
        .allow(null)
        .optional(),

    email: emailSchema
        .allow(null)
        .optional(),

    // Соціальні мережі
    socialMedia: Joi.object({
        instagram: urlSchema.allow('').optional(),
        facebook: urlSchema.allow('').optional(),
        telegram: urlSchema.allow('').optional(),
        whatsapp: urlSchema.allow('').optional()
    }).optional(),

    // Для external типу
    externalUrl: urlSchema
        .allow(null)
        .optional()
        .when('type', {
            is: WEBSITE_TYPE.EXTERNAL,
            then: Joi.required().messages({
                'any.required': 'External URL is required for external website type'
            })
        }),

    analyticsEnabled: Joi.boolean()
        .optional()
        .default(false),

    // Статус (опціонально, default: draft)
    status: Joi.string()
        .valid(...Object.values(WEBSITE_STATUS))
        .optional()
        .messages({
            'any.only': `Status must be one of: ${Object.values(WEBSITE_STATUS).join(', ')}`
        })
}).options({ stripUnknown: true });

// ============================================
// UPDATE WEBSITE SCHEMA
// ============================================

export const updateWebsiteSchema = Joi.object({
    // Всі поля опціональні при оновленні
    type: Joi.forbidden() // Не можна змінювати тип після створення
        .messages({
            'any.unknown': 'Website type cannot be changed after creation'
        }),

    metaTitle: Joi.string()
        .min(10)
        .max(60)
        .trim()
        .optional()
        .messages({
            'string.min': 'Meta title must be at least 10 characters',
            'string.max': 'Meta title must not exceed 60 characters'
        }),

    slogan: Joi.string()
        .max(100)
        .trim()
        .allow('')
        .optional()
        .messages({
            'string.max': 'Slogan must not exceed 100 characters'
        }),

    description: Joi.string()
        .max(1000)
        .trim()
        .allow('')
        .optional()
        .messages({
            'string.max': 'Description must not exceed 1000 characters'
        }),

    metaDescription: Joi.string()
        .max(160)
        .trim()
        .allow('')
        .optional()
        .messages({
            'string.max': 'Meta description must not exceed 160 characters'
        }),

    phone: phoneSchema
        .allow(null)
        .optional(),

    email: emailSchema
        .allow(null)
        .optional(),

    socialMedia: Joi.object({
        instagram: urlSchema.allow('').optional(),
        facebook: urlSchema.allow('').optional(),
        telegram: urlSchema.allow('').optional(),
        whatsapp: urlSchema.allow('').optional()
    }).optional(),

    externalUrl: urlSchema
        .allow(null)
        .optional(),

    analyticsEnabled: Joi.boolean()
        .optional(),

    status: Joi.string()
        .valid(...Object.values(WEBSITE_STATUS))
        .optional()
        .messages({
            'any.only': `Status must be one of: ${Object.values(WEBSITE_STATUS).join(', ')}`
        })
})
    .min(1) // Мінімум одне поле має бути передане
    .options({ stripUnknown: true })
    .messages({
        'object.min': 'At least one field must be provided for update'
    });

// ============================================
// PARAMS SCHEMAS
// ============================================

export const websiteIdSchema = Joi.object({
    id: objectIdSchema.required()
        .messages({
            'any.required': 'Website ID is required',
            'string.empty': 'Website ID cannot be empty'
        })
});

export const websiteSlugSchema = Joi.object({
    slug: slugSchema.required()
        .messages({
            'any.required': 'Website slug is required',
            'string.empty': 'Website slug cannot be empty'
        })
});

// ============================================
// QUERY SCHEMAS
// ============================================

export const websiteQuerySchema = Joi.object({
    // Фільтри
    type: Joi.string()
        .valid(...Object.values(WEBSITE_TYPE))
        .optional()
        .messages({
            'any.only': `Type must be one of: ${Object.values(WEBSITE_TYPE).join(', ')}`
        }),

    status: Joi.string()
        .valid(...Object.values(WEBSITE_STATUS))
        .optional()
        .messages({
            'any.only': `Status must be one of: ${Object.values(WEBSITE_STATUS).join(', ')}`
        }),

    businessId: objectIdSchema
        .optional(),

    // Пагінація
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .optional()
        .messages({
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(10)
        .optional()
        .messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit must not exceed 50'
        }),

    // Сортування
    sortBy: Joi.string()
        .valid('createdAt', 'updatedAt', 'metaTitle', 'viewsCount', 'requestsCount')
        .default('createdAt')
        .optional()
        .messages({
            'any.only': 'sortBy must be one of: createdAt, updatedAt, metaTitle, viewsCount, requestsCount'
        }),

    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
        .optional()
        .messages({
            'any.only': 'sortOrder must be either asc or desc'
        }),

    // Populate
    populate: Joi.boolean()
        .default(false)
        .optional()
}).options({ stripUnknown: true });

// ============================================
// EXPORT
// ============================================

export default {
    createWebsiteSchema,
    updateWebsiteSchema,
    websiteIdSchema,
    websiteSlugSchema,
    websiteQuerySchema
};