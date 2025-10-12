/**
 * User Model
 * Mongoose v8.19.1 з best practices
 */

import mongoose from 'mongoose';
import { logSuccess, logInfo, logError } from '../utils/logger.js';

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        // ============================================
        // GOOGLE OAUTH
        // ============================================

        googleId: {
            type: String,
            required: [true, 'Google ID є обов\'язковим'],
            unique: true,
            trim: true,
            immutable: true // Mongoose 8.x - не можна змінювати після створення
        },

        email: {
            type: String,
            required: [true, 'Email є обов\'язковим'],
            unique: true,
            lowercase: true, // Автоматично конвертує в lowercase
            trim: true,
            immutable: true,
            match: [
                /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                'Email має невірний формат'
            ]
        },

        name: {
            type: String,
            required: [true, 'Ім\'я є обов\'язковим'],
            trim: true,
            minLength: [2, 'Ім\'я має містити мінімум 2 символи'],
            maxLength: [100, 'Ім\'я має містити максимум 100 символів']
        },

        avatar: {
            type: String,
            default: null,
            trim: true
        },

        // ============================================
        // РЕФЕРАЛЬНА СИСТЕМА (для майбутнього)
        // ============================================

        referralCode: {
            type: String,
            unique: true,
            sparse: true, // Дозволяє null/undefined бути не унікальними
            uppercase: true,
            trim: true,
            minLength: [6, 'Реферальний код має містити мінімум 6 символів'],
            maxLength: [20, 'Реферальний код має містити максимум 20 символів']
        },

        referredBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        referralDiscount: {
            type: Number,
            default: 0,
            min: [0, 'Знижка не може бути менше 0%'],
            max: [20, 'Знижка не може бути більше 20%']
        },

        // ============================================
        // СТАТИСТИКА
        // ============================================

        totalBusinesses: {
            type: Number,
            default: 0,
            min: [0, 'Кількість бізнесів не може бути від\'ємною']
        },

        totalWebsites: {
            type: Number,
            default: 0,
            min: [0, 'Кількість сайтів не може бути від\'ємною']
        },

        totalQRCodes: {
            type: Number,
            default: 0,
            min: [0, 'Кількість QR кодів не може бути від\'ємною']
        },

        // ============================================
        // МЕТАДАНІ
        // ============================================

        lastLoginAt: {
            type: Date,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        // ============================================
        // SCHEMA OPTIONS
        // ============================================

        timestamps: true, // Додає createdAt та updatedAt автоматично

        // Видаляємо __v при toJSON
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
// INDEXES
// ============================================

userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ referralCode: 1 }, { sparse: true });

// ============================================
// VIRTUALS
// ============================================

userSchema.virtual('fullName').get(function () {
    return this.name;
});

// ============================================
// INSTANCE METHODS
// ============================================

userSchema.methods.updateLastLogin = async function () {
    this.lastLoginAt = new Date();
    return this.save();
};

userSchema.methods.updateStats = async function (stats) {
    if (stats.totalBusinesses !== undefined) this.totalBusinesses = stats.totalBusinesses;
    if (stats.totalWebsites !== undefined) this.totalWebsites = stats.totalWebsites;
    if (stats.totalQRCodes !== undefined) this.totalQRCodes = stats.totalQRCodes;
    return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

userSchema.statics.findByGoogleId = function (googleId) {
    return this.findOne({ googleId, isActive: true });
};

userSchema.statics.findByEmail = function (email) {
    return this.findOne({
        email: email.toLowerCase(),
        isActive: true
    });
};

userSchema.statics.findByReferralCode = function (referralCode) {
    return this.findOne({
        referralCode: referralCode.toUpperCase(),
        isActive: true
    });
};

// ============================================
// MIDDLEWARE HOOKS
// ============================================

// Pre-save: логування створення
userSchema.pre('save', function (next) {
    if (this.isNew) {
        logInfo('Creating new user', {
            email: this.email,
            name: this.name
        });
    }
    next();
});

// Post-save: логування успіху
userSchema.post('save', function (doc, next) {
    const action = doc.wasNew ? 'created' : 'updated';
    logSuccess(`User ${action}`, {
        userId: doc._id,
        email: doc.email
    });
    next();
});

// Post-save error: обробка помилок
userSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        logError('Duplicate key error on user save', {
            field,
            value: error.keyValue[field]
        });
        next(new Error(`${field} вже використовується`));
    } else {
        logError('Error saving user', {
            message: error.message
        });
        next(error);
    }
});

// ============================================
// EXPORT MODEL
// ============================================

const User = mongoose.model('User', userSchema);

export default User;