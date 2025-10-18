/**
 * BusinessService
 * Бізнес-логіка для роботи з бізнесами
 * 
 * Відповідальність:
 * - CRUD операції для Business
 * - Генерація унікальних slug
 * - Завантаження/видалення logo через S3Service
 * - Оновлення статистики User
 * - Перевірка лімітів MVP
 */

import Business from '../models/Business.js';
import User from '../models/User.js';
import S3Service from './S3Service.js';
import { generateSlug, addSuffix, isReservedSlug } from '../utils/slugGenerator.js';
import { logInfo, logSuccess, logError, logWarn } from '../utils/logger.js';
import {
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '../utils/errorHandler.js';
import { MVP_LIMITS, BUSINESS_STATUS } from '../config/constants.js';

class BusinessService {
    constructor() {
        // Dependency Injection
        this.s3Service = new S3Service();
    }

    /**
     * Отримати всі бізнеси користувача
     * 
     * @param {String} userId - ID користувача
     * @param {Object} options - Опції (filters, pagination, sort)
     * @returns {Promise<Object>} - { businesses, total, page, limit }
     */
    async getUserBusinesses(userId, options = {}) {
        try {
            logInfo('Getting user businesses', { userId });

            const {
                status,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options;

            // Формуємо query
            const query = { userId, isActive: true };

            if (status) {
                query.status = status;
            }

            // Пагінація
            const skip = (page - 1) * limit;
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            // Виконуємо запити паралельно
            const [businesses, total] = await Promise.all([
                Business.find(query)
                    .select('-__v')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Business.countDocuments(query)
            ]);

            logSuccess('User businesses retrieved', {
                userId,
                count: businesses.length,
                total
            });

            return {
                businesses,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            logError('Failed to get user businesses', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Отримати бізнес по ID
     * 
     * @param {String} businessId - ID бізнесу
     * @param {String} userId - ID користувача (для перевірки власника)
     * @param {Object} options - Опції (populate)
     * @returns {Promise<Object>} - Business document
     */
    async getBusinessById(businessId, userId, options = {}) {
        try {
            logInfo('Getting business by ID', { businessId, userId });

            const { populate = false } = options;

            let query = Business.findOne({
                _id: businessId,
                userId,
                isActive: true
            });

            // Опціональний populate для websites та qrcodes
            if (populate) {
                query = query
                    .populate('websites', 'name type status slug')
                    .populate('qrcodes', 'name shortCode status');
            }

            const business = await query.lean();

            if (!business) {
                throw new NotFoundError('Business not found');
            }

            logSuccess('Business retrieved', { businessId });

            return business;

        } catch (error) {
            logError('Failed to get business', {
                businessId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Отримати бізнес по slug (публічний доступ)
     * 
     * @param {String} slug - Slug бізнесу
     * @returns {Promise<Object>} - Business document
     */
    async getBusinessBySlug(slug) {
        try {
            logInfo('Getting business by slug', { slug });

            const business = await Business.findBySlug(slug);

            if (!business) {
                throw new NotFoundError('Business not found');
            }

            return business;

        } catch (error) {
            logError('Failed to get business by slug', {
                slug,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Створити новий бізнес
     * 
     * @param {String} userId - ID користувача
     * @param {Object} businessData - Дані бізнесу
     * @param {Object} files - Файли (logo)
     * @returns {Promise<Object>} - Створений бізнес
     */
    async createBusiness(userId, businessData, files = {}) {
        try {
            logInfo('Creating business', { userId, name: businessData.name });

            // 1. Перевірка ліміту для MVP
            await this.checkBusinessLimit(userId);

            // 2. Генерація унікального slug
            const slug = await this.generateUniqueSlug(businessData.name);

            // 3. Завантаження logo якщо є
            let logoUrl = null;
            if (files.logo) {
                logoUrl = await this.s3Service.uploadFile(
                    files.logo[0],
                    'logos'
                );
            }

            // 4. Підготовка даних для створення
            const businessToCreate = {
                userId,
                name: businessData.name,
                slug,
                description: businessData.description || '',
                logo: logoUrl,
                phone: businessData.phone,
                email: businessData.email,
                address: businessData.address || {},
                socialMedia: businessData.socialMedia || {},
                status: BUSINESS_STATUS.ACTIVE,
                creationPaid: true, // Для MVP автоматично true
                creationFee: 10 // €10 за замовчуванням
            };

            // 5. Створення бізнесу
            const business = await Business.create(businessToCreate);

            logSuccess('Business created successfully', {
                businessId: business._id,
                slug: business.slug,
                userId
            });

            // Повертаємо plain object
            return business.toObject();

        } catch (error) {
            // Якщо була помилка після завантаження logo - видаляємо його
            if (files.logo && logoUrl) {
                try {
                    await this.s3Service.deleteFile(logoUrl);
                    logInfo('Cleaned up uploaded logo after error');
                } catch (cleanupError) {
                    logWarn('Failed to cleanup logo', {
                        error: cleanupError.message
                    });
                }
            }

            logError('Failed to create business', {
                userId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Оновити бізнес
     * 
     * @param {String} businessId - ID бізнесу
     * @param {String} userId - ID користувача
     * @param {Object} updateData - Дані для оновлення
     * @param {Object} files - Файли (logo)
     * @returns {Promise<Object>} - Оновлений бізнес
     */
    async updateBusiness(businessId, userId, updateData, files = {}) {
        try {
            logInfo('Updating business', { businessId, userId });

            // 1. Знайти бізнес та перевірити власника
            const business = await Business.findOne({
                _id: businessId,
                userId,
                isActive: true
            });

            if (!business) {
                throw new NotFoundError('Business not found');
            }

            const oldLogoUrl = business.logo;

            // 2. Оновлення slug якщо змінилась назва
            if (updateData.name && updateData.name !== business.name) {
                const newSlug = await this.generateUniqueSlug(
                    updateData.name,
                    businessId
                );
                updateData.slug = newSlug;
            }

            // 3. Оновлення logo якщо є новий файл
            if (files.logo) {
                // Завантажити новий logo
                const newLogoUrl = await this.s3Service.uploadFile(
                    files.logo[0],
                    'logos'
                );
                updateData.logo = newLogoUrl;

                // Видалити старий logo якщо був
                if (oldLogoUrl) {
                    await this.s3Service.deleteFile(oldLogoUrl);
                    logInfo('Old logo deleted', { oldLogoUrl });
                }
            }

            // 4. Оновлення полів
            const allowedFields = [
                'name',
                'slug',
                'description',
                'logo',
                'phone',
                'email',
                'address',
                'socialMedia',
                'status'
            ];

            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    business[field] = updateData[field];
                }
            });

            // 5. Збереження
            await business.save();

            logSuccess('Business updated successfully', {
                businessId,
                updatedFields: Object.keys(updateData)
            });

            return business.toObject();

        } catch (error) {
            logError('Failed to update business', {
                businessId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Видалити бізнес (soft delete)
     * 
     * @param {String} businessId - ID бізнесу
     * @param {String} userId - ID користувача
     * @returns {Promise<Boolean>} - true якщо успішно видалено
     */
    async deleteBusiness(businessId, userId) {
        try {
            logInfo('Deleting business', { businessId, userId });

            // 1. Знайти бізнес
            const business = await Business.findOne({
                _id: businessId,
                userId,
                isActive: true
            });

            if (!business) {
                throw new NotFoundError('Business not found');
            }

            // 2. Перевірка чи можна видалити
            // TODO: В майбутньому перевіряти чи є активні підписки
            if (business.websitesCount > 0 || business.qrCodesCount > 0) {
                throw new BadRequestError(
                    'Cannot delete business with active websites or QR codes. Please delete them first.'
                );
            }

            // 3. Видалити logo з S3 якщо є
            if (business.logo) {
                await this.s3Service.deleteFile(business.logo);
                logInfo('Business logo deleted', { businessId });
            }

            // 4. Soft delete
            business.isActive = false;
            business.status = BUSINESS_STATUS.INACTIVE;
            await business.save();

            // 5. Декремент User.totalBusinesses
            await User.findByIdAndUpdate(userId, {
                $inc: { totalBusinesses: -1 }
            });

            logSuccess('Business deleted successfully', { businessId });

            return true;

        } catch (error) {
            logError('Failed to delete business', {
                businessId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Отримати статистику бізнесу
     * 
     * @param {String} businessId - ID бізнесу
     * @param {String} userId - ID користувача
     * @returns {Promise<Object>} - Статистика
     */
    async getBusinessStats(businessId, userId) {
        try {
            logInfo('Getting business stats', { businessId, userId });

            const business = await this.getBusinessById(businessId, userId);

            const stats = {
                websitesCount: business.websitesCount,
                qrCodesCount: business.qrCodesCount,
                totalScans: business.totalScans,
                totalRequests: business.totalRequests,
                createdAt: business.createdAt,
                status: business.status
            };

            return stats;

        } catch (error) {
            logError('Failed to get business stats', {
                businessId,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // HELPER METHODS (PRIVATE)
    // ============================================

    /**
     * Перевірка ліміту бізнесів для MVP
     * 
     * @param {String} userId - ID користувача
     * @throws {ConflictError} - Якщо досягнуто ліміт
     */
    async checkBusinessLimit(userId) {
        const businessCount = await Business.countDocuments({
            userId,
            isActive: true
        });

        if (businessCount >= MVP_LIMITS.MAX_BUSINESSES_PER_USER) {
            logWarn('Business limit reached', {
                userId,
                current: businessCount,
                limit: MVP_LIMITS.MAX_BUSINESSES_PER_USER
            });

            throw new ConflictError(
                `Business limit reached. Maximum ${MVP_LIMITS.MAX_BUSINESSES_PER_USER} business allowed for MVP.`
            );
        }
    }

    /**
     * Генерація унікального slug
     * 
     * @param {String} name - Назва бізнесу
     * @param {String} excludeId - ID бізнесу для виключення (при оновленні)
     * @returns {Promise<String>} - Унікальний slug
     */
    async generateUniqueSlug(name, excludeId = null) {
        try {
            // 1. Генерація базового slug
            let slug = generateSlug(name);

            // 2. Перевірка на зарезервовані slug
            if (isReservedSlug(slug)) {
                slug = addSuffix(slug, 1);
            }

            // 3. Перевірка унікальності в БД
            let counter = 2;
            let isUnique = false;

            while (!isUnique) {
                const isTaken = await Business.isSlugTaken(slug, excludeId);

                if (!isTaken) {
                    isUnique = true;
                } else {
                    // Генеруємо новий slug з суфіксом
                    const baseSlug = generateSlug(name);
                    slug = addSuffix(baseSlug, counter);
                    counter++;
                }

                // Захист від нескінченного циклу
                if (counter > 100) {
                    throw new Error('Could not generate unique slug');
                }
            }

            logInfo('Unique slug generated', { slug, iterations: counter - 2 });

            return slug;

        } catch (error) {
            logError('Failed to generate unique slug', {
                name,
                error: error.message
            });
            throw error;
        }
    }
}

// ============================================
// EXPORT
// ============================================

export default BusinessService;