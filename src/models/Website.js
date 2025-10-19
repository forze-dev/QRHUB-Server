/**
 * Website Model
 * Mongoose схема для сайтів (card, catalog, external)
 */

import mongoose from 'mongoose';
import { logSuccess, logInfo, logError, logWarn } from '../utils/logger.js';
import { WEBSITE_TYPE, WEBSITE_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

const websiteSchema = new Schema(
    {
        // ============================================
        // ЗВ'ЯЗОК З BUSINESS
        // ============================================

        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'Business ID є обов\'язковим'],
            immutable: true,
            index: true
        },

        // ============================================
        // ОСНОВНА ІНФОРМАЦІЯ
        // ============================================

        type: {
            type: String,
            enum: {
                values: Object.values(WEBSITE_TYPE),
                message: 'Невалідний тип сайту'
            },
            required: [true, 'Тип сайту є обов\'язковим'],
            immutable: true // Не можна змінювати тип після створення
        },

        slug: {
            type: String,
            required: [true, 'Slug є обов\'язковим'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            match: [
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                'Slug може містити тільки малі літери, цифри та дефіси'
            ]
        },

        // ============================================
        // SEO ТА КОНТЕНТ
        // ============================================

        metaTitle: {
            type: String,
            required: [true, 'Meta title є обов\'язковим'],
            trim: true,
            minLength: [10, 'Meta title має містити мінімум 10 символів'],
            maxLength: [60, 'Meta title має містити максимум 60 символів']
        },

        slogan: {
            type: String,
            trim: true,
            maxLength: [100, 'Slogan має містити максимум 100 символів'],
            default: ''
        },

        description: {
            type: String,
            trim: true,
            maxLength: [1000, 'Опис має містити максимум 1000 символів'],
            default: ''
        },

        metaDescription: {
            type: String,
            trim: true,
            maxLength: [160, 'Meta description має містити максимум 160 символів'],
            default: ''
        },

        // ============================================
        // ЗОБРАЖЕННЯ
        // ============================================

        coverImage: {
            type: String,
            default: null,
            trim: true,
            // Обов'язкове для card та catalog (валідація в pre-save)
        },

        // ============================================
        // КОНТАКТИ
        // ============================================

        phone: {
            type: String,
            trim: true,
            default: null,
            match: [
                /^\+?[1-9]\d{1,14}$/,
                'Невалідний формат телефону'
            ]
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
            match: [
                /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                'Невалідний формат email'
            ]
        },

        // ============================================
        // СОЦІАЛЬНІ МЕРЕЖІ
        // ============================================

        socialMedia: {
            instagram: { type: String, trim: true, default: '' },
            facebook: { type: String, trim: true, default: '' },
            telegram: { type: String, trim: true, default: '' },
            whatsapp: { type: String, trim: true, default: '' }
        },

        // ============================================
        // ДЛЯ EXTERNAL ТИПУ
        // ============================================

        externalUrl: {
            type: String,
            trim: true,
            default: null,
            // Обов'язкове якщо type='external' (валідація в pre-save)
            match: [
                /^https?:\/\/.+/,
                'External URL має починатись з http:// або https://'
            ]
        },

        analyticsEnabled: {
            type: Boolean,
            default: false
        },

        // ============================================
        // СТАТУС
        // ============================================

        status: {
            type: String,
            enum: {
                values: Object.values(WEBSITE_STATUS),
                message: 'Невалідний статус сайту'
            },
            default: WEBSITE_STATUS.DRAFT,
            index: true
        },

        // ============================================
        // СТАТИСТИКА
        // ============================================

        viewsCount: {
            type: Number,
            default: 0,
            min: [0, 'Кількість переглядів не може бути від\'ємною']
        },

        requestsCount: {
            type: Number,
            default: 0,
            min: [0, 'Кількість заявок не може бути від\'ємною']
        },

        // ============================================
        // SOFT DELETE
        // ============================================

        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        // ============================================
        // SCHEMA OPTIONS
        // ============================================

        timestamps: true,

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
 * Публічний URL сайту
 * Приклад: "site.qrhub.online/kafe-le-monde"
 */
websiteSchema.virtual('publicUrl').get(function () {
    const baseUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000';
    return `${baseUrl}/${this.slug}`;
});

/**
 * Virtual populate для products (тільки для catalog)
 */
websiteSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'websiteId'
});

// ============================================
// INDEXES
// ============================================

// Складений індекс для отримання сайтів бізнесу
websiteSchema.index({ businessId: 1, isActive: 1 });

// Складений індекс для публічного пошуку
websiteSchema.index({ slug: 1, isActive: 1, status: 1 });

// Складений індекс для фільтрації по типу
websiteSchema.index({ businessId: 1, type: 1 });

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Інкремент переглядів
 */
websiteSchema.methods.incrementViews = async function () {
    this.viewsCount += 1;
    return this.save({ validateBeforeSave: false });
};

/**
 * Інкремент заявок
 */
websiteSchema.methods.incrementRequests = async function () {
    this.requestsCount += 1;

    // Також інкрементуємо totalRequests в Business
    try {
        const Business = mongoose.model('Business');
        await Business.findByIdAndUpdate(
            this.businessId,
            { $inc: { totalRequests: 1 } }
        );
    } catch (error) {
        logError('Failed to increment Business totalRequests', {
            businessId: this.businessId,
            error: error.message
        });
    }

    return this.save({ validateBeforeSave: false });
};

/**
 * Активувати сайт
 */
websiteSchema.methods.activate = async function () {
    this.status = WEBSITE_STATUS.ACTIVE;
    return this.save();
};

/**
 * Деактивувати сайт
 */
websiteSchema.methods.deactivate = async function () {
    this.status = WEBSITE_STATUS.INACTIVE;
    return this.save();
};

/**
 * Перевірка чи потребує сайт coverImage
 */
websiteSchema.methods.requiresCoverImage = function () {
    return this.type === WEBSITE_TYPE.CARD || this.type === WEBSITE_TYPE.CATALOG;
};

/**
 * Перевірка чи може мати products
 */
websiteSchema.methods.canHaveProducts = function () {
    return this.type === WEBSITE_TYPE.CATALOG;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Знайти сайт по slug (для публічного доступу)
 */
websiteSchema.statics.findBySlug = function (slug) {
    return this.findOne({
        slug: slug.toLowerCase(),
        isActive: true,
        status: WEBSITE_STATUS.ACTIVE
    }).populate('businessId', 'name logo');
};

/**
 * Знайти всі сайти бізнесу
 */
websiteSchema.statics.findByBusinessId = function (businessId) {
    return this.find({
        businessId,
        isActive: true
    }).sort({ createdAt: -1 });
};

/**
 * Підрахувати сайти бізнесу
 */
websiteSchema.statics.countByBusinessId = function (businessId) {
    return this.countDocuments({
        businessId,
        isActive: true
    });
};

// ============================================
// VALIDATION
// ============================================

// Custom валідація для coverImage та externalUrl
websiteSchema.pre('validate', function (next) {
    // Якщо type='card' або 'catalog' → coverImage обов'язковий
    if (this.requiresCoverImage() && !this.coverImage) {
        this.invalidate('coverImage', 'Cover image є обов\'язковим для card та catalog');
    }

    // Якщо type='external' → externalUrl обов'язковий
    if (this.type === WEBSITE_TYPE.EXTERNAL && !this.externalUrl) {
        this.invalidate('externalUrl', 'External URL є обов\'язковим для external сайту');
    }

    next();
});

// ============================================
// MIDDLEWARE HOOKS
// ============================================

// Pre-save: логування створення
websiteSchema.pre('save', function (next) {
    if (this.isNew) {
        logInfo('Creating new website', {
            businessId: this.businessId,
            type: this.type,
            slug: this.slug
        });
    }
    next();
});

// Post-save: логування успіху та оновлення Business.websitesCount
websiteSchema.post('save', async function (doc, next) {
    const action = doc.wasNew ? 'created' : 'updated';
    logSuccess(`Website ${action}`, {
        websiteId: doc._id,
        type: doc.type,
        slug: doc.slug
    });

    // Інкремент websitesCount у Business (тільки при створенні)
    if (doc.wasNew) {
        try {
            const Business = mongoose.model('Business');
            await Business.findByIdAndUpdate(doc.businessId, {
                $inc: { websitesCount: 1 }
            });
            logInfo('Business websitesCount incremented', { businessId: doc.businessId });
        } catch (error) {
            logError('Failed to update Business websitesCount', {
                businessId: doc.businessId,
                error: error.message
            });
        }
    }

    next();
});

// Post-save error: обробка помилок
websiteSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        logError('Duplicate slug error on website save', {
            slug: doc.slug
        });
        next(new Error('Website з таким slug вже існує'));
    } else if (error.name === 'ValidationError') {
        logError('Website validation error', {
            errors: Object.keys(error.errors)
        });
        next(error);
    } else {
        logError('Error saving website', {
            message: error.message
        });
        next(error);
    }
});

// Pre-remove: логування та декремент Business.websitesCount
websiteSchema.pre('remove', async function (next) {
    logInfo('Removing website', {
        websiteId: this._id,
        slug: this.slug
    });

    try {
        const Business = mongoose.model('Business');
        await Business.findByIdAndUpdate(this.businessId, {
            $inc: { websitesCount: -1 }
        });
        logInfo('Business websitesCount decremented', { businessId: this.businessId });
    } catch (error) {
        logError('Failed to update Business websitesCount on remove', {
            businessId: this.businessId,
            error: error.message
        });
    }

    next();
});

// ============================================
// EXPORT MODEL
// ============================================

const Website = mongoose.model('Website', websiteSchema);

export default Website;