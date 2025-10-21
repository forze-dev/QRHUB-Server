/**
 * QRCode Model
 * Mongoose схема для QR кодів
 * 
 * QR код може вести на:
 * - Сайт бізнесу (card або catalog)
 * - Зовнішній URL (для external websites)
 * - Конкретну секцію сайту (меню, акції, контакти)
 */

import mongoose from 'mongoose';
import { logSuccess, logInfo, logError } from '../utils/logger.js';
import { QR_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

const qrcodeSchema = new Schema(
    {
        // ============================================
        // ЗВ'ЯЗКИ
        // ============================================

        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'Business ID є обов\'язковим'],
            immutable: true,
            index: true
        },

        websiteId: {
            type: Schema.Types.ObjectId,
            ref: 'Website',
            required: [true, 'Website ID є обов\'язковим'],
            immutable: true,
            index: true
        },

        // ============================================
        // ОСНОВНА ІНФОРМАЦІЯ
        // ============================================

        name: {
            type: String,
            required: [true, 'Назва QR коду є обов\'язковою'],
            trim: true,
            minLength: [3, 'Назва має містити мінімум 3 символи'],
            maxLength: [100, 'Назва має містити максимум 100 символів']
        },

        description: {
            type: String,
            trim: true,
            maxLength: [500, 'Опис має містити максимум 500 символів'],
            default: ''
        },

        // ============================================
        // URL ТА REDIRECT
        // ============================================

        targetUrl: {
            type: String,
            required: [true, 'Target URL є обов\'язковим'],
            trim: true,
            validate: {
                validator: function (v) {
                    return /^https?:\/\/.+/.test(v);
                },
                message: 'Target URL має бути валідним URL'
            }
        },

        shortCode: {
            type: String,
            required: [true, 'Short code є обов\'язковим'],
            unique: true,
            trim: true,
            lowercase: true,
            minLength: [6, 'Short code має містити мінімум 6 символів'],
            maxLength: [20, 'Short code має містити максимум 20 символів'],
            index: true
        },

        // ============================================
        // QR IMAGE
        // ============================================

        qrImageUrl: {
            type: String,
            required: [true, 'QR image URL є обов\'язковим'],
            trim: true
        },

        // ============================================
        // ДИЗАЙН (для майбутнього)
        // ============================================

        logoUrl: {
            type: String,
            trim: true,
            default: null
        },

        primaryColor: {
            type: String,
            trim: true,
            default: '#000000',
            validate: {
                validator: function (v) {
                    return /^#[0-9A-Fa-f]{6}$/.test(v);
                },
                message: 'Primary color має бути валідним hex кольором'
            }
        },

        backgroundColor: {
            type: String,
            trim: true,
            default: '#FFFFFF',
            validate: {
                validator: function (v) {
                    return /^#[0-9A-Fa-f]{6}$/.test(v);
                },
                message: 'Background color має бути валідним hex кольором'
            }
        },

        // ============================================
        // СТАТУС
        // ============================================

        status: {
            type: String,
            enum: {
                values: Object.values(QR_STATUS),
                message: 'Невалідний статус QR коду'
            },
            default: QR_STATUS.ACTIVE
        },

        // ============================================
        // СТАТИСТИКА (кешована)
        // ============================================

        totalScans: {
            type: Number,
            default: 0,
            min: [0, 'Total scans не може бути менше 0']
        },

        uniqueScans: {
            type: Number,
            default: 0,
            min: [0, 'Unique scans не може бути менше 0']
        },

        lastScanAt: {
            type: Date,
            default: null
        },

        // ============================================
        // SOFT DELETE
        // ============================================

        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ============================================
// VIRTUALS
// ============================================

/**
 * Короткий URL для QR коду
 */
qrcodeSchema.virtual('shortUrl').get(function () {
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    return `${baseUrl}/s/${this.shortCode}`;
});

/**
 * Повний публічний URL
 */
qrcodeSchema.virtual('publicUrl').get(function () {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/qr/${this.shortCode}`;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Інкрементувати totalScans та оновити lastScanAt
 */
qrcodeSchema.methods.incrementScans = async function (isUnique = false) {
    this.totalScans += 1;
    if (isUnique) {
        this.uniqueScans += 1;
    }
    this.lastScanAt = new Date();

    return this.save({ validateBeforeSave: false });
};

/**
 * Активувати QR код
 */
qrcodeSchema.methods.activate = async function () {
    this.status = QR_STATUS.ACTIVE;
    return this.save();
};

/**
 * Деактивувати QR код
 */
qrcodeSchema.methods.deactivate = async function () {
    this.status = QR_STATUS.INACTIVE;
    return this.save();
};

/**
 * Архівувати QR код
 */
qrcodeSchema.methods.archive = async function () {
    this.status = QR_STATUS.ARCHIVED;
    return this.save();
};

/**
 * Перевірка чи активний QR код
 */
qrcodeSchema.methods.isActiveStatus = function () {
    return this.status === QR_STATUS.ACTIVE && this.isActive;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Знайти QR код по shortCode
 */
qrcodeSchema.statics.findByShortCode = function (shortCode) {
    return this.findOne({
        shortCode: shortCode.toLowerCase(),
        isActive: true,
        status: QR_STATUS.ACTIVE
    })
        .populate('businessId', 'name slug')
        .populate('websiteId', 'slug type');
};

/**
 * Знайти всі QR коди бізнесу
 */
qrcodeSchema.statics.findByBusiness = function (businessId, options = {}) {
    const query = {
        businessId,
        isActive: true
    };

    if (options.status) {
        query.status = options.status;
    }

    return this.find(query)
        .populate('websiteId', 'name type slug')
        .sort({ createdAt: -1 });
};

/**
 * Знайти всі QR коди сайту
 */
qrcodeSchema.statics.findByWebsite = function (websiteId, options = {}) {
    const query = {
        websiteId,
        isActive: true
    };

    if (options.status) {
        query.status = options.status;
    }

    return this.find(query).sort({ createdAt: -1 });
};

/**
 * Порахувати активні QR коди бізнесу
 */
qrcodeSchema.statics.countByBusiness = function (businessId) {
    return this.countDocuments({
        businessId,
        isActive: true,
        status: { $ne: QR_STATUS.ARCHIVED }
    });
};

/**
 * Перевірити чи існує shortCode
 */
qrcodeSchema.statics.isShortCodeExists = async function (shortCode) {
    const qrcode = await this.findOne({ shortCode: shortCode.toLowerCase() });
    return !!qrcode;
};

// ============================================
// MIDDLEWARE HOOKS
// ============================================

// Pre-save: логування створення
qrcodeSchema.pre('save', function (next) {
    if (this.isNew) {
        logInfo('Creating new QR code', {
            businessId: this.businessId,
            websiteId: this.websiteId,
            name: this.name,
            shortCode: this.shortCode
        });
    }
    next();
});

// Post-save: логування успіху та інкремент Business.qrCodesCount
qrcodeSchema.post('save', async function (doc, next) {
    const action = doc.wasNew ? 'created' : 'updated';
    logSuccess(`QR code ${action}`, {
        qrcodeId: doc._id,
        name: doc.name,
        shortCode: doc.shortCode
    });

    // Інкрементуємо qrCodesCount у Business (тільки при створенні)
    if (doc.wasNew) {
        try {
            const Business = mongoose.model('Business');
            await Business.findByIdAndUpdate(doc.businessId, {
                $inc: { qrCodesCount: 1 }
            });
            logInfo('Business qrCodesCount incremented', { businessId: doc.businessId });
        } catch (error) {
            logError('Failed to update Business qrCodesCount', {
                businessId: doc.businessId,
                error: error.message
            });
        }
    }

    next();
});

// Post-save error: обробка помилок
qrcodeSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        logError('Duplicate shortCode error on QR code save', {
            shortCode: doc.shortCode
        });
        next(new Error('QR код з таким shortCode вже існує'));
    } else if (error.name === 'ValidationError') {
        logError('QR code validation error', {
            errors: Object.keys(error.errors)
        });
        next(error);
    } else {
        logError('Error saving QR code', {
            message: error.message
        });
        next(error);
    }
});

// Pre-remove: логування та декремент Business.qrCodesCount
qrcodeSchema.pre('remove', async function (next) {
    logInfo('Removing QR code', {
        qrcodeId: this._id,
        shortCode: this.shortCode
    });

    try {
        const Business = mongoose.model('Business');
        await Business.findByIdAndUpdate(this.businessId, {
            $inc: { qrCodesCount: -1 }
        });
        logInfo('Business qrCodesCount decremented', { businessId: this.businessId });
    } catch (error) {
        logError('Failed to update Business qrCodesCount on remove', {
            businessId: this.businessId,
            error: error.message
        });
    }

    next();
});

// ============================================
// INDEXES
// ============================================

// Складені індекси для оптимізації запитів
qrcodeSchema.index({ businessId: 1, createdAt: -1 });
qrcodeSchema.index({ websiteId: 1, createdAt: -1 });
qrcodeSchema.index({ businessId: 1, status: 1 });
qrcodeSchema.index({ isActive: 1, status: 1 });

// Прості індекси вже створені через поля:
// - businessId: { index: true }
// - websiteId: { index: true }
// - shortCode: { unique: true }
// - isActive: { index: true }

// ============================================
// EXPORT MODEL
// ============================================

const QRCode = mongoose.model('QRCode', qrcodeSchema);

export default QRCode;