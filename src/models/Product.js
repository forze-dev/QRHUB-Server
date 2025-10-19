/**
 * Product Model
 * Mongoose схема для товарів каталогу
 * 
 * Використовується тільки для Website type='catalog'
 */

import mongoose from 'mongoose';
import { logSuccess, logInfo, logError } from '../utils/logger.js';

const { Schema } = mongoose;

const productSchema = new Schema(
    {
        // ============================================
        // ЗВ'ЯЗОК З WEBSITE
        // ============================================

        websiteId: {
            type: Schema.Types.ObjectId,
            ref: 'Website',
            required: [true, 'Website ID є обов\'язковим'],
            immutable: true, // Не можна переносити товар між сайтами
            index: true
        },

        // ============================================
        // ОСНОВНА ІНФОРМАЦІЯ
        // ============================================

        name: {
            type: String,
            required: [true, 'Назва товару є обов\'язковою'],
            trim: true,
            minLength: [3, 'Назва товару має містити мінімум 3 символи'],
            maxLength: [100, 'Назва товару має містити максимум 100 символів']
        },

        description: {
            type: String,
            trim: true,
            maxLength: [500, 'Опис товару має містити максимум 500 символів'],
            default: ''
        },

        // ============================================
        // ЦІНА
        // ============================================

        price: {
            type: Number,
            required: [true, 'Ціна товару є обов\'язковою'],
            min: [0, 'Ціна не може бути від\'ємною'],
            set: (val) => Math.round(val * 100) / 100 // Округлення до 2 знаків
        },

        currency: {
            type: String,
            enum: {
                values: ['UAH', 'EUR', 'USD'],
                message: 'Валюта має бути UAH, EUR або USD'
            },
            default: 'UAH',
            uppercase: true
        },

        // ============================================
        // ЗОБРАЖЕННЯ
        // ============================================

        image: {
            type: String,
            default: null,
            trim: true
        },

        // ============================================
        // СТАТУС ТА ПОРЯДОК
        // ============================================

        isAvailable: {
            type: Boolean,
            default: true,
            index: true
        },

        order: {
            type: Number,
            default: 0,
            min: [0, 'Порядок не може бути від\'ємним']
        }
    },
    {
        // ============================================
        // SCHEMA OPTIONS
        // ============================================

        timestamps: true, // createdAt, updatedAt

        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            }
        },

        toObject: { virtuals: true }
    }
);

// ============================================
// VIRTUALS
// ============================================

/**
 * Форматована ціна з валютою
 * Приклад: "85.00 UAH"
 */
productSchema.virtual('formattedPrice').get(function () {
    return `${this.price.toFixed(2)} ${this.currency}`;
});

// ============================================
// INDEXES
// ============================================

// Складений індекс для отримання товарів сайту з сортуванням
productSchema.index({ websiteId: 1, order: 1 });

// Складений індекс для фільтрації доступних товарів
productSchema.index({ websiteId: 1, isAvailable: 1 });

// Складений індекс для сортування по ціні
productSchema.index({ websiteId: 1, price: 1 });

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Перемкнути доступність товару
 */
productSchema.methods.toggleAvailability = async function () {
    this.isAvailable = !this.isAvailable;
    return this.save();
};

/**
 * Оновити порядок відображення
 */
productSchema.methods.updateOrder = async function (newOrder) {
    this.order = newOrder;
    return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Знайти всі товари сайту
 */
productSchema.statics.findByWebsiteId = function (websiteId, options = {}) {
    const query = { websiteId };

    // Фільтр по доступності
    if (options.isAvailable !== undefined) {
        query.isAvailable = options.isAvailable;
    }

    return this.find(query)
        .sort(options.sort || { order: 1 })
        .select(options.select || '-__v');
};

/**
 * Підрахувати кількість товарів сайту
 */
productSchema.statics.countByWebsiteId = function (websiteId) {
    return this.countDocuments({ websiteId });
};

/**
 * Отримати максимальний order для сайту
 */
productSchema.statics.getMaxOrder = async function (websiteId) {
    const result = await this.findOne({ websiteId })
        .sort({ order: -1 })
        .select('order')
        .lean();

    return result ? result.order : 0;
};

// ============================================
// MIDDLEWARE HOOKS
// ============================================

// Pre-save: логування створення
productSchema.pre('save', function (next) {
    if (this.isNew) {
        logInfo('Creating new product', {
            websiteId: this.websiteId,
            name: this.name,
            price: this.price
        });
    }
    next();
});

// Post-save: логування успіху
productSchema.post('save', function (doc, next) {
    const action = doc.wasNew ? 'created' : 'updated';
    logSuccess(`Product ${action}`, {
        productId: doc._id,
        name: doc.name,
        websiteId: doc.websiteId
    });
    next();
});

// Post-save error: обробка помилок
productSchema.post('save', function (error, doc, next) {
    if (error.name === 'ValidationError') {
        logError('Product validation error', {
            errors: Object.keys(error.errors)
        });
    } else {
        logError('Error saving product', {
            message: error.message
        });
    }
    next(error);
});

// Pre-remove: логування видалення
productSchema.pre('remove', function (next) {
    logInfo('Removing product', {
        productId: this._id,
        name: this.name,
        websiteId: this.websiteId
    });
    next();
});

// ============================================
// EXPORT MODEL
// ============================================

const Product = mongoose.model('Product', productSchema);

export default Product;