/**
 * QRScan Model
 * Mongoose схема для tracking сканувань QR кодів
 * 
 * Кожен скан зберігає:
 * - Коли відскановано
 * - Звідки (країна, місто, IP)
 * - З якого пристрою (iOS, Android, Desktop)
 * - Fingerprint для визначення унікальних користувачів
 */

import mongoose from 'mongoose';
import { logSuccess, logInfo, logError } from '../utils/logger.js';
import { DEVICE_TYPE } from '../config/constants.js';

const { Schema } = mongoose;

const qrscanSchema = new Schema(
    {
        // ============================================
        // ЗВ'ЯЗКИ
        // ============================================

        qrCodeId: {
            type: Schema.Types.ObjectId,
            ref: 'QRCode',
            required: [true, 'QR Code ID є обов\'язковим'],
            immutable: true,
            index: true
        },

        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'Business ID є обов\'язковим'],
            immutable: true,
            index: true // Для швидкої агрегації по бізнесу
        },

        websiteId: {
            type: Schema.Types.ObjectId,
            ref: 'Website',
            required: [true, 'Website ID є обов\'язковим'],
            immutable: true,
            index: true
        },

        // ============================================
        // ЧАС СКАНУВАННЯ
        // ============================================

        scannedAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true // Для фільтрації по датах
        },

        // ============================================
        // ГЕОЛОКАЦІЯ
        // ============================================

        country: {
            type: String,
            trim: true,
            default: 'Unknown',
            index: true // Для агрегації по країнах
        },

        city: {
            type: String,
            trim: true,
            default: 'Unknown',
            index: true // Для агрегації по містах
        },

        ipAddress: {
            type: String,
            trim: true,
            required: [true, 'IP address є обов\'язковим'],
            validate: {
                validator: function (v) {
                    // Перевірка IPv4 або IPv6
                    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
                    const ipv6Regex = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$/;
                    return ipv4Regex.test(v) || ipv6Regex.test(v);
                },
                message: 'Невалідний формат IP адреси'
            }
        },

        // ============================================
        // ПРИСТРІЙ ТА БРАУЗЕР
        // ============================================

        device: {
            type: String,
            enum: {
                values: Object.values(DEVICE_TYPE),
                message: 'Невалідний тип пристрою'
            },
            default: DEVICE_TYPE.OTHER,
            index: true // Для агрегації по пристроях
        },

        browser: {
            type: String,
            trim: true,
            default: 'Unknown'
        },

        os: {
            type: String,
            trim: true,
            default: 'Unknown'
        },

        userAgent: {
            type: String,
            trim: true,
            required: [true, 'User agent є обов\'язковим']
        },

        // ============================================
        // FINGERPRINT ДЛЯ УНІКАЛЬНОСТІ
        // ============================================

        fingerprint: {
            type: String,
            required: [true, 'Fingerprint є обов\'язковим'],
            trim: true,
            index: true // Для підрахунку унікальних сканів
        },

        // ============================================
        // ДОДАТКОВА ІНФОРМАЦІЯ
        // ============================================

        referrer: {
            type: String,
            trim: true,
            default: null
        },

        // Для майбутнього: UTM параметри
        utmSource: {
            type: String,
            trim: true,
            default: null
        },

        utmMedium: {
            type: String,
            trim: true,
            default: null
        },

        utmCampaign: {
            type: String,
            trim: true,
            default: null
        }
    },
    {
        timestamps: true, // createdAt, updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ============================================
// VIRTUALS
// ============================================

/**
 * Отримати дату у форматі YYYY-MM-DD
 */
qrscanSchema.virtual('scanDate').get(function () {
    return this.scannedAt.toISOString().split('T')[0];
});

/**
 * Отримати годину сканування (0-23)
 */
qrscanSchema.virtual('scanHour').get(function () {
    return this.scannedAt.getHours();
});

/**
 * Отримати день тижня (0-6, 0 = неділя)
 */
qrscanSchema.virtual('scanDayOfWeek').get(function () {
    return this.scannedAt.getDay();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Перевірка чи це мобільний пристрій
 */
qrscanSchema.methods.isMobileDevice = function () {
    return this.device === DEVICE_TYPE.IOS || this.device === DEVICE_TYPE.ANDROID;
};

/**
 * Перевірка чи це desktop
 */
qrscanSchema.methods.isDesktopDevice = function () {
    return this.device === DEVICE_TYPE.DESKTOP;
};

/**
 * Отримати локацію у форматі "City, Country"
 */
qrscanSchema.methods.getLocation = function () {
    if (this.city === 'Unknown' && this.country === 'Unknown') {
        return 'Unknown';
    }
    if (this.city === 'Unknown') {
        return this.country;
    }
    return `${this.city}, ${this.country}`;
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Порахувати всі скани QR коду
 */
qrscanSchema.statics.countByQRCode = function (qrCodeId, dateFilter = {}) {
    return this.countDocuments({
        qrCodeId,
        ...dateFilter
    });
};

/**
 * Порахувати унікальні скани QR коду
 */
qrscanSchema.statics.countUniqueByQRCode = async function (qrCodeId, dateFilter = {}) {
    const uniqueFingerprints = await this.distinct('fingerprint', {
        qrCodeId,
        ...dateFilter
    });
    return uniqueFingerprints.length;
};

/**
 * Отримати скани по датах (для графіка)
 */
qrscanSchema.statics.getScansByDate = function (qrCodeId, dateFilter = {}) {
    return this.aggregate([
        { $match: { qrCodeId: new mongoose.Types.ObjectId(qrCodeId), ...dateFilter } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id',
                scans: '$count'
            }
        }
    ]);
};

/**
 * Отримати скани по годинах (години пік)
 */
qrscanSchema.statics.getScansByHour = function (qrCodeId, dateFilter = {}) {
    return this.aggregate([
        { $match: { qrCodeId: new mongoose.Types.ObjectId(qrCodeId), ...dateFilter } },
        {
            $group: {
                _id: { $hour: '$scannedAt' },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                hour: '$_id',
                scans: '$count'
            }
        }
    ]);
};

/**
 * Отримати скани по країнах
 */
qrscanSchema.statics.getScansByCountry = function (qrCodeId, dateFilter = {}, limit = 10) {
    return this.aggregate([
        { $match: { qrCodeId: new mongoose.Types.ObjectId(qrCodeId), ...dateFilter } },
        {
            $group: {
                _id: '$country',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
            $project: {
                _id: 0,
                country: '$_id',
                scans: '$count'
            }
        }
    ]);
};

/**
 * Отримати скани по містах
 */
qrscanSchema.statics.getScansByCity = function (qrCodeId, dateFilter = {}, limit = 10) {
    return this.aggregate([
        { $match: { qrCodeId: new mongoose.Types.ObjectId(qrCodeId), ...dateFilter } },
        {
            $group: {
                _id: { city: '$city', country: '$country' },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
            $project: {
                _id: 0,
                city: '$_id.city',
                country: '$_id.country',
                scans: '$count'
            }
        }
    ]);
};

/**
 * Отримати скани по типах пристроїв
 */
qrscanSchema.statics.getScansByDevice = function (qrCodeId, dateFilter = {}) {
    return this.aggregate([
        { $match: { qrCodeId: new mongoose.Types.ObjectId(qrCodeId), ...dateFilter } },
        {
            $group: {
                _id: '$device',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        {
            $project: {
                _id: 0,
                device: '$_id',
                scans: '$count'
            }
        }
    ]);
};

/**
 * Перевірити чи fingerprint вже сканував цей QR сьогодні
 */
qrscanSchema.statics.isUniqueScanToday = async function (qrCodeId, fingerprint) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scan = await this.findOne({
        qrCodeId,
        fingerprint,
        scannedAt: { $gte: today }
    });

    return !scan; // true якщо не знайдено (унікальний скан)
};

// ============================================
// MIDDLEWARE HOOKS
// ============================================

// Pre-save: логування створення
qrscanSchema.pre('save', function (next) {
    if (this.isNew) {
        logInfo('Recording QR scan', {
            qrCodeId: this.qrCodeId,
            device: this.device,
            country: this.country,
            city: this.city
        });
    }
    next();
});

// Post-save: логування успіху
qrscanSchema.post('save', function (doc, next) {
    if (doc.wasNew) {
        logSuccess('QR scan recorded', {
            scanId: doc._id,
            qrCodeId: doc.qrCodeId,
            location: doc.getLocation(),
            device: doc.device
        });
    }
    next();
});

// Post-save error: обробка помилок
qrscanSchema.post('save', function (error, doc, next) {
    if (error.name === 'ValidationError') {
        logError('QR scan validation error', {
            errors: Object.keys(error.errors)
        });
    } else {
        logError('Error saving QR scan', {
            message: error.message
        });
    }
    next(error);
});

// ============================================
// INDEXES
// ============================================

// Складені індекси для агрегацій та аналітики
qrscanSchema.index({ qrCodeId: 1, scannedAt: -1 });
qrscanSchema.index({ businessId: 1, scannedAt: -1 });
qrscanSchema.index({ qrCodeId: 1, fingerprint: 1 });
qrscanSchema.index({ qrCodeId: 1, device: 1 });
qrscanSchema.index({ qrCodeId: 1, country: 1 });

// Для підрахунку унікальних сканів
qrscanSchema.index({ qrCodeId: 1, fingerprint: 1, scannedAt: -1 });

// TTL index для автоматичного видалення старих записів (опціонально)
// Видаляти скани старші за 2 роки
// qrscanSchema.index({ scannedAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 роки

// Прості індекси вже створені через поля:
// - qrCodeId: { index: true }
// - businessId: { index: true }
// - websiteId: { index: true }
// - scannedAt: { index: true }
// - country: { index: true }
// - city: { index: true }
// - device: { index: true }
// - fingerprint: { index: true }

// ============================================
// EXPORT MODEL
// ============================================

const QRScan = mongoose.model('QRScan', qrscanSchema);

export default QRScan;