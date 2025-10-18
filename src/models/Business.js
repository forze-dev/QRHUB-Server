/**
 * Business Model
 * Mongoose схема для бізнесу
 */

import mongoose from 'mongoose';
import { logSuccess, logInfo, logError } from '../utils/logger.js';
import { BUSINESS_STATUS, SUBSCRIPTION_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

const businessSchema = new Schema(
    {
        // ============================================
        // ВЛАСНИК
        // ============================================

        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            immutable: true, // Не можна змінювати власника після створення
            index: true
        },

        // ============================================
        // ОСНОВНА ІНФОРМАЦІЯ
        // ============================================

        name: {
            type: String,
            required: [true, 'Business name is required'],
            trim: true,
            minLength: [3, 'Business name must be at least 3 characters'],
            maxLength: [100, 'Business name must not exceed 100 characters']
        },

        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
            match: [
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                'Slug can only contain lowercase letters, numbers and hyphens'
            ]
        },

        description: {
            type: String,
            trim: true,
            maxLength: [500, 'Description must not exceed 500 characters'],
            default: ''
        },

        logo: {
            type: String,
            default: null,
            trim: true
        },

        // ============================================
        // СТАТУС
        // ============================================

        status: {
            type: String,
            enum: {
                values: Object.values(BUSINESS_STATUS),
                message: 'Invalid business status'
            },
            default: BUSINESS_STATUS.ACTIVE
        },

        // ============================================
        // КОНТАКТНА ІНФОРМАЦІЯ
        // ============================================

        phone: {
            type: String,
            trim: true,
            default: null,
            match: [
                /^\+?[1-9]\d{1,14}$/,
                'Invalid phone number format'
            ]
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
            match: [
                /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                'Invalid email format'
            ]
        },

        address: {
            street: { type: String, trim: true, default: '' },
            city: { type: String, trim: true, default: '' },
            state: { type: String, trim: true, default: '' },
            country: { type: String, trim: true, default: '' },
            zip: { type: String, trim: true, default: '' }
        },

        // ============================================
        // СОЦІАЛЬНІ МЕРЕЖІ
        // ============================================

        socialMedia: {
            instagram: { type: String, trim: true, default: '' },
            facebook: { type: String, trim: true, default: '' },
            website: { type: String, trim: true, default: '' },
            linkedin: { type: String, trim: true, default: '' },
            twitter: { type: String, trim: true, default: '' }
        },

        // ============================================
        // ПІДПИСКА (для майбутнього, але закладаємо зараз)
        // ============================================

        subscriptionStatus: {
            type: String,
            enum: {
                values: Object.values(SUBSCRIPTION_STATUS),
                message: 'Invalid subscription status'
            },
            default: SUBSCRIPTION_STATUS.ACTIVE
        },

        subscriptionExpiresAt: {
            type: Date,
            default: null
        },

        // ============================================
        // ОПЛАТА СТВОРЕННЯ (для майбутнього)
        // ============================================

        creationFee: {
            type: Number,
            default: 10, // €10 за замовчуванням для MVP
            min: [0, 'Creation fee cannot be negative']
        },

        creationPaid: {
            type: Boolean,
            default: true // Для MVP автоматично true
        },

        creationPaidAt: {
            type: Date,
            default: Date.now // Для MVP - зараз
        },

        // ============================================
        // ЛІЧИЛЬНИКИ (для оптимізації запитів)
        // ============================================

        websitesCount: {
            type: Number,
            default: 0,
            min: [0, 'Websites count cannot be negative']
        },

        qrCodesCount: {
            type: Number,
            default: 0,
            min: [0, 'QR codes count cannot be negative']
        },

        totalScans: {
            type: Number,
            default: 0,
            min: [0, 'Total scans cannot be negative']
        },

        totalRequests: {
            type: Number,
            default: 0,
            min: [0, 'Total requests cannot be negative']
        },

        // ============================================
        // МЕТАДАНІ
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
// ВІРТУАЛЬНІ ПОЛЯ (для populate)
// ============================================

// Віртуальне поле для websites
businessSchema.virtual('websites', {
    ref: 'Website',
    localField: '_id',
    foreignField: 'businessId',
    justOne: false
});

// Віртуальне поле для qrcodes
businessSchema.virtual('qrcodes', {
    ref: 'QRCode',
    localField: '_id',
    foreignField: 'businessId',
    justOne: false
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Оновлює статистику бізнесу
 */
businessSchema.methods.updateStats = async function (stats) {
    if (stats.websitesCount !== undefined) this.websitesCount = stats.websitesCount;
    if (stats.qrCodesCount !== undefined) this.qrCodesCount = stats.qrCodesCount;
    if (stats.totalScans !== undefined) this.totalScans = stats.totalScans;
    if (stats.totalRequests !== undefined) this.totalRequests = stats.totalRequests;
    return this.save();
};

/**
 * Інкремент лічильника websites
 */
businessSchema.methods.incrementWebsiteCount = async function () {
    this.websitesCount += 1;
    return this.save();
};

/**
 * Декремент лічильника websites
 */
businessSchema.methods.decrementWebsiteCount = async function () {
    if (this.websitesCount > 0) {
        this.websitesCount -= 1;
    }
    return this.save();
};

/**
 * Інкремент лічильника QR кодів
 */
businessSchema.methods.incrementQRCodeCount = async function () {
    this.qrCodesCount += 1;
    return this.save();
};

/**
 * Декремент лічильника QR кодів
 */
businessSchema.methods.decrementQRCodeCount = async function () {
    if (this.qrCodesCount > 0) {
        this.qrCodesCount -= 1;
    }
    return this.save();
};

/**
 * Інкремент лічильника сканувань
 */
businessSchema.methods.incrementScanCount = async function (count = 1) {
    this.totalScans += count;
    return this.save();
};

/**
 * Інкремент лічильника заявок
 */
businessSchema.methods.incrementRequestCount = async function () {
    this.totalRequests += 1;
    return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Знайти бізнес по slug
 */
businessSchema.statics.findBySlug = function (slug) {
    return this.findOne({ slug, isActive: true });
};

/**
 * Знайти всі бізнеси користувача
 */
businessSchema.statics.findByUserId = function (userId) {
    return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

/**
 * Знайти активні бізнеси користувача
 */
businessSchema.statics.findActiveBusinesses = function (userId) {
    return this.find({
        userId,
        isActive: true,
        status: BUSINESS_STATUS.ACTIVE
    }).sort({ createdAt: -1 });
};

/**
 * Перевірка чи існує slug
 */
businessSchema.statics.isSlugTaken = async function (slug, excludeId = null) {
    const query = { slug };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    const business = await this.findOne(query);
    return !!business;
};

// ============================================
// MIDDLEWARE HOOKS
// ============================================

// Pre-save: логування створення
businessSchema.pre('save', function (next) {
    if (this.isNew) {
        logInfo('Creating new business', {
            userId: this.userId,
            name: this.name,
            slug: this.slug
        });
    }
    next();
});

// Post-save: логування успіху та оновлення User.totalBusinesses
businessSchema.post('save', async function (doc, next) {
    const action = doc.wasNew ? 'created' : 'updated';
    logSuccess(`Business ${action}`, {
        businessId: doc._id,
        name: doc.name,
        slug: doc.slug
    });

    // Оновлюємо totalBusinesses у User (тільки при створенні)
    if (doc.wasNew) {
        try {
            const User = mongoose.model('User');
            await User.findByIdAndUpdate(doc.userId, {
                $inc: { totalBusinesses: 1 }
            });
            logInfo('User totalBusinesses incremented', { userId: doc.userId });
        } catch (error) {
            logError('Failed to update User totalBusinesses', {
                userId: doc.userId,
                error: error.message
            });
        }
    }

    next();
});

// Post-save error: обробка помилок
businessSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        logError('Duplicate key error on business save', {
            field,
            value: error.keyValue[field]
        });
        next(new Error(`Business with this ${field} already exists`));
    } else {
        logError('Error saving business', {
            message: error.message
        });
        next(error);
    }
});

// Pre-remove: логування та декремент User.totalBusinesses
businessSchema.pre('remove', async function (next) {
    logInfo('Removing business', {
        businessId: this._id,
        name: this.name
    });

    try {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(this.userId, {
            $inc: { totalBusinesses: -1 }
        });
        logInfo('User totalBusinesses decremented', { userId: this.userId });
    } catch (error) {
        logError('Failed to update User totalBusinesses on remove', {
            userId: this.userId,
            error: error.message
        });
    }

    next();
});

// ============================================
// INDEXES (тільки складені, прості вже є у полях)
// ============================================

// Складений індекс для пагінації та сортування по користувачу
businessSchema.index({ userId: 1, createdAt: -1 });

// Складений індекс для фільтрації по користувачу та статусу
businessSchema.index({ userId: 1, status: 1 });

// Складений індекс для активних бізнесів з певним статусом
businessSchema.index({ isActive: 1, status: 1 });

// Прості індекси вже створені через поля:
// - userId: { index: true } → { userId: 1 }
// - slug: { unique: true } → { slug: 1, unique }
// - isActive: { index: true } → { isActive: 1 }

// ============================================
// EXPORT MODEL
// ============================================

const Business = mongoose.model('Business', businessSchema);

export default Business;