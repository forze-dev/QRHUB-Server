/**
 * Product Validator
 * Joi схеми валідації для Product endpoints
 */

import Joi from 'joi';

// ============================================
// HELPER SCHEMAS
// ============================================

// MongoDB ObjectId валідація
const objectIdSchema = Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .message('Invalid MongoDB ObjectId format');

// ============================================
// CREATE PRODUCT SCHEMA
// ============================================

export const createProductSchema = Joi.object({
    // Обов'язкові поля
    websiteId: objectIdSchema.required()
        .messages({
            'any.required': 'Website ID is required',
            'string.empty': 'Website ID cannot be empty'
        }),

    name: Joi.string()
        .min(3)
        .max(100)
        .trim()
        .required()
        .messages({
            'any.required': 'Product name is required',
            'string.empty': 'Product name cannot be empty',
            'string.min': 'Product name must be at least 3 characters',
            'string.max': 'Product name must not exceed 100 characters'
        }),

    price: Joi.number()
        .min(0)
        .precision(2)
        .required()
        .messages({
            'any.required': 'Product price is required',
            'number.min': 'Price cannot be negative',
            'number.base': 'Price must be a number'
        }),

    // Опціональні поля
    description: Joi.string()
        .max(500)
        .trim()
        .allow('')
        .optional()
        .messages({
            'string.max': 'Description must not exceed 500 characters'
        }),

    currency: Joi.string()
        .valid('UAH', 'EUR', 'USD')
        .uppercase()
        .default('UAH')
        .optional()
        .messages({
            'any.only': 'Currency must be one of: UAH, EUR, USD'
        }),

    isAvailable: Joi.boolean()
        .default(true)
        .optional(),

    order: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .optional()
        .messages({
            'number.min': 'Order must be a positive number',
            'number.integer': 'Order must be an integer'
        })
}).options({ stripUnknown: true });

// ============================================
// UPDATE PRODUCT SCHEMA
// ============================================

export const updateProductSchema = Joi.object({
    // Всі поля опціональні при оновленні
    websiteId: Joi.forbidden() // Не можна переносити товар між сайтами
        .messages({
            'any.unknown': 'Website ID cannot be changed after creation'
        }),

    name: Joi.string()
        .min(3)
        .max(100)
        .trim()
        .optional()
        .messages({
            'string.min': 'Product name must be at least 3 characters',
            'string.max': 'Product name must not exceed 100 characters'
        }),

    description: Joi.string()
        .max(500)
        .trim()
        .allow('')
        .optional()
        .messages({
            'string.max': 'Description must not exceed 500 characters'
        }),

    price: Joi.number()
        .min(0)
        .precision(2)
        .optional()
        .messages({
            'number.min': 'Price cannot be negative',
            'number.base': 'Price must be a number'
        }),

    currency: Joi.string()
        .valid('UAH', 'EUR', 'USD')
        .uppercase()
        .optional()
        .messages({
            'any.only': 'Currency must be one of: UAH, EUR, USD'
        }),

    isAvailable: Joi.boolean()
        .optional(),

    order: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
            'number.min': 'Order must be a positive number',
            'number.integer': 'Order must be an integer'
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

export const productIdSchema = Joi.object({
    id: objectIdSchema.required()
        .messages({
            'any.required': 'Product ID is required',
            'string.empty': 'Product ID cannot be empty'
        })
});

export const websiteIdParamSchema = Joi.object({
    websiteId: objectIdSchema.required()
        .messages({
            'any.required': 'Website ID is required',
            'string.empty': 'Website ID cannot be empty'
        })
});

// ============================================
// QUERY SCHEMAS
// ============================================

export const productQuerySchema = Joi.object({
    // Фільтри
    websiteId: objectIdSchema
        .optional(),

    isAvailable: Joi.boolean()
        .optional(),

    minPrice: Joi.number()
        .min(0)
        .optional()
        .messages({
            'number.min': 'Minimum price cannot be negative'
        }),

    maxPrice: Joi.number()
        .min(0)
        .optional()
        .when('minPrice', {
            is: Joi.exist(),
            then: Joi.number().min(Joi.ref('minPrice')).messages({
                'number.min': 'Maximum price must be greater than minimum price'
            })
        })
        .messages({
            'number.min': 'Maximum price cannot be negative'
        }),

    currency: Joi.string()
        .valid('UAH', 'EUR', 'USD')
        .uppercase()
        .optional()
        .messages({
            'any.only': 'Currency must be one of: UAH, EUR, USD'
        }),

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
        .valid('order', 'name', 'price', 'createdAt', 'updatedAt')
        .default('order')
        .optional()
        .messages({
            'any.only': 'sortBy must be one of: order, name, price, createdAt, updatedAt'
        }),

    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('asc')
        .optional()
        .messages({
            'any.only': 'sortOrder must be either asc or desc'
        })
}).options({ stripUnknown: true });

// ============================================
// BULK UPDATE ORDER SCHEMA
// ============================================

export const bulkUpdateOrderSchema = Joi.object({
    websiteId: objectIdSchema.required()
        .messages({
            'any.required': 'Website ID is required',
            'string.empty': 'Website ID cannot be empty'
        }),

    orders: Joi.array()
        .items(
            Joi.object({
                productId: objectIdSchema.required()
                    .messages({
                        'any.required': 'Product ID is required in order item'
                    }),
                order: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'any.required': 'Order number is required',
                        'number.min': 'Order must be a positive number',
                        'number.integer': 'Order must be an integer'
                    })
            })
        )
        .min(1)
        .required()
        .messages({
            'any.required': 'Orders array is required',
            'array.min': 'At least one order item must be provided'
        })
}).options({ stripUnknown: true });

// ============================================
// EXPORT
// ============================================

export default {
    createProductSchema,
    updateProductSchema,
    productIdSchema,
    websiteIdParamSchema,
    productQuerySchema,
    bulkUpdateOrderSchema
};