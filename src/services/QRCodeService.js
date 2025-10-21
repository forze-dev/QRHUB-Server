/**
 * QRCodeService
 * Бізнес-логіка для роботи з QR кодами
 * 
 * Відповідальність:
 * - CRUD операції для QR кодів
 * - Генерація QR images та завантаження в S3
 * - Генерація унікальних shortCodes
 * - Перевірка MVP лімітів
 * - Управління статусами QR кодів
 */

import QRCode from '../models/QRCode.js';
import Business from '../models/Business.js';
import Website from '../models/Website.js';
import S3Service from './S3Service.js';
import { generateQRCodeBuffer } from '../utils/qrGenerator.js';
import { generateSafeShortCode } from '../utils/shortCodeGenerator.js';
import { logInfo, logSuccess, logError, logWarn } from '../utils/logger.js';
import {
    NotFoundError,
    ConflictError,
    ForbiddenError
} from '../utils/errorHandler.js';
import { MVP_LIMITS, QR_STATUS, SHORT_CODE_SETTINGS } from '../config/constants.js';

class QRCodeService {
    constructor() {
        // Dependency Injection
        this.s3Service = new S3Service();
    }

    // ============================================
    // CRUD ОПЕРАЦІЇ
    // ============================================

    /**
     * Отримати всі QR коди користувача
     * 
     * @param {String} userId - ID користувача
     * @param {Object} options - Опції (filters, pagination, sort)
     * @returns {Promise<Object>} - { qrcodes, pagination }
     */
    async getUserQRCodes(userId, options = {}) {
        try {
            logInfo('Getting user QR codes', { userId });

            const {
                status,
                businessId,
                websiteId,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options;

            // Спочатку знайдемо всі businesses користувача
            const userBusinesses = await Business.find({
                userId,
                isActive: true
            }).select('_id');

            const businessIds = userBusinesses.map(b => b._id);

            if (businessIds.length === 0) {
                return {
                    qrcodes: [],
                    pagination: {
                        total: 0,
                        page: Number(page),
                        limit: Number(limit),
                        pages: 0
                    }
                };
            }

            // Формуємо query
            const query = {
                businessId: { $in: businessIds },
                isActive: true
            };

            if (status) {
                query.status = status;
            }

            if (businessId) {
                // Перевірка що business належить користувачу
                if (!businessIds.some(id => id.toString() === businessId)) {
                    throw new ForbiddenError('Доступ до цього бізнесу заборонено');
                }
                query.businessId = businessId;
            }

            if (websiteId) {
                query.websiteId = websiteId;
            }

            // Пагінація
            const skip = (page - 1) * limit;
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            // Виконуємо запити паралельно
            const [qrcodes, total] = await Promise.all([
                QRCode.find(query)
                    .select('-__v')
                    .populate('businessId', 'name slug')
                    .populate('websiteId', 'name type slug')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                QRCode.countDocuments(query)
            ]);

            logSuccess('User QR codes retrieved', {
                userId,
                count: qrcodes.length,
                total
            });

            return {
                qrcodes,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            logError('Failed to get user QR codes', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Отримати QR код по ID
     * 
     * @param {String} qrcodeId - ID QR коду
     * @param {String} userId - ID користувача (для перевірки власника)
     * @returns {Promise<Object>} - QR code document
     */
    async getQRCodeById(qrcodeId, userId) {
        try {
            logInfo('Getting QR code by ID', { qrcodeId, userId });

            const qrcode = await QRCode.findOne({
                _id: qrcodeId,
                isActive: true
            })
                .populate('businessId', 'name slug userId')
                .populate('websiteId', 'name type slug')
                .lean();

            if (!qrcode) {
                throw new NotFoundError('QR код не знайдено');
            }

            // Перевірка власника
            if (qrcode.businessId.userId.toString() !== userId) {
                throw new ForbiddenError('Доступ до цього QR коду заборонено');
            }

            logSuccess('QR code retrieved', { qrcodeId });

            return qrcode;

        } catch (error) {
            logError('Failed to get QR code', {
                qrcodeId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Створити новий QR код
     * 
     * @param {String} userId - ID користувача
     * @param {Object} qrcodeData - Дані QR коду
     * @param {String} qrcodeData.businessId - ID бізнесу
     * @param {String} qrcodeData.websiteId - ID сайту
     * @param {String} qrcodeData.name - Назва QR
     * @param {String} qrcodeData.description - Опис
     * @param {String} qrcodeData.targetUrl - URL куди веде QR
     * @param {String} qrcodeData.primaryColor - Колір QR (optional)
     * @param {String} qrcodeData.backgroundColor - Колір фону (optional)
     * @returns {Promise<Object>} - Створений QR код
     */
    async createQRCode(userId, qrcodeData) {
        try {
            logInfo('Creating QR code', { userId, name: qrcodeData.name });

            const { businessId, websiteId, name, description, targetUrl, primaryColor, backgroundColor } = qrcodeData;

            // 1. Перевірка власника business
            const business = await Business.findOne({
                _id: businessId,
                userId,
                isActive: true
            });

            if (!business) {
                throw new NotFoundError('Бізнес не знайдено');
            }

            // 2. Перевірка що website належить до business
            const website = await Website.findOne({
                _id: websiteId,
                businessId,
                isActive: true
            });

            if (!website) {
                throw new NotFoundError('Сайт не знайдено або не належить до цього бізнесу');
            }

            // 3. Перевірка MVP ліміту QR кодів
            await this.checkQRLimit(websiteId);

            // 4. Генерація унікального shortCode
            const shortCode = await this.generateUniqueShortCode();

            // 5. Генерація QR image
            const qrOptions = {
                primaryColor: primaryColor || '#000000',
                backgroundColor: backgroundColor || '#FFFFFF'
            };

            const qrImageBuffer = await generateQRCodeBuffer(targetUrl, qrOptions);

            // 6. Завантаження QR image в S3
            const qrImageUrl = await this.s3Service.uploadBuffer(
                qrImageBuffer,
                `qrcode-${shortCode}.png`,
                'qrcodes',
                'image/png'
            );

            logSuccess('QR image uploaded to S3', { qrImageUrl });

            // 7. Створення QR коду в БД
            const qrcode = await QRCode.create({
                businessId,
                websiteId,
                name,
                description: description || '',
                targetUrl,
                shortCode,
                qrImageUrl,
                primaryColor: qrOptions.primaryColor,
                backgroundColor: qrOptions.backgroundColor,
                status: QR_STATUS.ACTIVE
            });

            logSuccess('QR code created successfully', {
                qrcodeId: qrcode._id,
                shortCode: qrcode.shortCode
            });

            // Повертаємо з populated полями
            return await QRCode.findById(qrcode._id)
                .populate('businessId', 'name slug')
                .populate('websiteId', 'name type slug')
                .lean();

        } catch (error) {
            logError('Failed to create QR code', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Оновити QR код
     * 
     * @param {String} qrcodeId - ID QR коду
     * @param {String} userId - ID користувача
     * @param {Object} updateData - Дані для оновлення
     * @returns {Promise<Object>} - Оновлений QR код
     */
    async updateQRCode(qrcodeId, userId, updateData) {
        try {
            logInfo('Updating QR code', { qrcodeId, userId });

            // 1. Перевірка власника
            const qrcode = await this.getQRCodeById(qrcodeId, userId);

            // 2. Якщо змінився targetUrl - перегенеруємо QR image
            let needsRegeneration = false;
            if (updateData.targetUrl && updateData.targetUrl !== qrcode.targetUrl) {
                needsRegeneration = true;
            }

            if ((updateData.primaryColor || updateData.backgroundColor) &&
                (updateData.primaryColor !== qrcode.primaryColor ||
                    updateData.backgroundColor !== qrcode.backgroundColor)) {
                needsRegeneration = true;
            }

            // Фільтруємо дозволені поля для оновлення
            const allowedUpdates = ['name', 'description', 'targetUrl', 'primaryColor', 'backgroundColor', 'status'];
            const updates = {};

            for (const key of allowedUpdates) {
                if (updateData[key] !== undefined) {
                    updates[key] = updateData[key];
                }
            }

            // 3. Регенерація QR якщо потрібно
            if (needsRegeneration) {
                const qrOptions = {
                    primaryColor: updates.primaryColor || qrcode.primaryColor,
                    backgroundColor: updates.backgroundColor || qrcode.backgroundColor
                };

                const qrImageBuffer = await generateQRCodeBuffer(
                    updates.targetUrl || qrcode.targetUrl,
                    qrOptions
                );

                // Видалити старий image з S3
                if (qrcode.qrImageUrl) {
                    await this.s3Service.deleteFile(qrcode.qrImageUrl);
                    logInfo('Old QR image deleted', { url: qrcode.qrImageUrl });
                }

                // Завантажити новий
                const newImageUrl = await this.s3Service.uploadBuffer(
                    qrImageBuffer,
                    `qrcode-${qrcode.shortCode}.png`,
                    'qrcodes',
                    'image/png'
                );

                updates.qrImageUrl = newImageUrl;
                logSuccess('QR image regenerated', { url: newImageUrl });
            }

            // 4. Оновлення в БД
            const updatedQRCode = await QRCode.findByIdAndUpdate(
                qrcodeId,
                { $set: updates },
                { new: true, runValidators: true }
            )
                .populate('businessId', 'name slug')
                .populate('websiteId', 'name type slug')
                .lean();

            logSuccess('QR code updated', { qrcodeId });

            return updatedQRCode;

        } catch (error) {
            logError('Failed to update QR code', {
                qrcodeId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Видалити QR код (soft delete)
     * 
     * @param {String} qrcodeId - ID QR коду
     * @param {String} userId - ID користувача
     * @returns {Promise<Boolean>}
     */
    async deleteQRCode(qrcodeId, userId) {
        try {
            logInfo('Deleting QR code', { qrcodeId, userId });

            // Перевірка власника
            await this.getQRCodeById(qrcodeId, userId);

            // Soft delete
            await QRCode.findByIdAndUpdate(qrcodeId, {
                $set: {
                    isActive: false,
                    deletedAt: new Date(),
                    status: QR_STATUS.ARCHIVED
                }
            });

            logSuccess('QR code deleted (soft)', { qrcodeId });

            return true;

        } catch (error) {
            logError('Failed to delete QR code', {
                qrcodeId,
                userId,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // СПЕЦІАЛЬНІ ОПЕРАЦІЇ
    // ============================================

    /**
     * Регенерувати QR image (якщо пошкоджено або потрібен новий дизайн)
     * 
     * @param {String} qrcodeId - ID QR коду
     * @param {String} userId - ID користувача
     * @returns {Promise<Object>} - Оновлений QR код
     */
    async regenerateQRImage(qrcodeId, userId) {
        try {
            logInfo('Regenerating QR image', { qrcodeId, userId });

            // Перевірка власника
            const qrcode = await this.getQRCodeById(qrcodeId, userId);

            // Генерація нового QR
            const qrOptions = {
                primaryColor: qrcode.primaryColor,
                backgroundColor: qrcode.backgroundColor
            };

            const qrImageBuffer = await generateQRCodeBuffer(qrcode.targetUrl, qrOptions);

            // Видалити старий
            if (qrcode.qrImageUrl) {
                await this.s3Service.deleteFile(qrcode.qrImageUrl);
            }

            // Завантажити новий
            const newImageUrl = await this.s3Service.uploadBuffer(
                qrImageBuffer,
                `qrcode-${qrcode.shortCode}.png`,
                'qrcodes',
                'image/png'
            );

            // Оновити в БД
            const updatedQRCode = await QRCode.findByIdAndUpdate(
                qrcodeId,
                { $set: { qrImageUrl: newImageUrl } },
                { new: true }
            )
                .populate('businessId', 'name slug')
                .populate('websiteId', 'name type slug')
                .lean();

            logSuccess('QR image regenerated', { qrcodeId, newImageUrl });

            return updatedQRCode;

        } catch (error) {
            logError('Failed to regenerate QR image', {
                qrcodeId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Активувати QR код
     */
    async activateQRCode(qrcodeId, userId) {
        try {
            await this.getQRCodeById(qrcodeId, userId);

            const qrcode = await QRCode.findById(qrcodeId);
            await qrcode.activate();

            logSuccess('QR code activated', { qrcodeId });

            return await QRCode.findById(qrcodeId)
                .populate('businessId', 'name slug')
                .populate('websiteId', 'name type slug')
                .lean();

        } catch (error) {
            logError('Failed to activate QR code', {
                qrcodeId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Деактивувати QR код
     */
    async deactivateQRCode(qrcodeId, userId) {
        try {
            await this.getQRCodeById(qrcodeId, userId);

            const qrcode = await QRCode.findById(qrcodeId);
            await qrcode.deactivate();

            logSuccess('QR code deactivated', { qrcodeId });

            return await QRCode.findById(qrcodeId)
                .populate('businessId', 'name slug')
                .populate('websiteId', 'name type slug')
                .lean();

        } catch (error) {
            logError('Failed to deactivate QR code', {
                qrcodeId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Отримати статистику QR коду
     */
    async getQRCodeStats(qrcodeId, userId) {
        try {
            const qrcode = await this.getQRCodeById(qrcodeId, userId);

            const stats = {
                qrCode: {
                    id: qrcode._id,
                    name: qrcode.name,
                    shortCode: qrcode.shortCode,
                    status: qrcode.status
                },
                totalScans: qrcode.totalScans,
                uniqueScans: qrcode.uniqueScans,
                lastScanAt: qrcode.lastScanAt,
                createdAt: qrcode.createdAt,
                shortUrl: `${process.env.API_URL || 'http://localhost:5000'}/s/${qrcode.shortCode}`
            };

            logSuccess('QR code stats retrieved', { qrcodeId });

            return stats;

        } catch (error) {
            logError('Failed to get QR code stats', {
                qrcodeId,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Генерує унікальний shortCode
     */
    async generateUniqueShortCode(maxAttempts = 10) {
        try {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                const shortCode = generateSafeShortCode(SHORT_CODE_SETTINGS.DEFAULT_LENGTH);

                // Перевірка унікальності
                const exists = await QRCode.isShortCodeExists(shortCode);

                if (!exists) {
                    logSuccess('Unique short code generated', { shortCode, attempt });
                    return shortCode;
                }

                logWarn('Short code collision, retrying', { shortCode, attempt });
            }

            // Якщо всі спроби неуспішні - збільшуємо довжину
            const longerCode = generateSafeShortCode(SHORT_CODE_SETTINGS.DEFAULT_LENGTH + 2);
            logWarn('Using longer code after collisions', { code: longerCode });
            return longerCode;

        } catch (error) {
            logError('Failed to generate unique short code', {
                error: error.message
            });
            throw new Error('Не вдалося згенерувати унікальний код');
        }
    }

    /**
     * Перевірка MVP ліміту QR кодів
     */
    async checkQRLimit(websiteId) {
        try {
            const count = await QRCode.countDocuments({
                websiteId,
                isActive: true,
                status: { $ne: QR_STATUS.ARCHIVED }
            });

            if (count >= MVP_LIMITS.MAX_QR_CODES_PER_WEBSITE) {
                throw new ConflictError(
                    `Досягнуто ліміт QR кодів для MVP (${MVP_LIMITS.MAX_QR_CODES_PER_WEBSITE} на сайт)`
                );
            }

            logInfo('QR limit check passed', { websiteId, current: count, limit: MVP_LIMITS.MAX_QR_CODES_PER_WEBSITE });

        } catch (error) {
            if (error instanceof ConflictError) {
                throw error;
            }
            logError('Failed to check QR limit', {
                websiteId,
                error: error.message
            });
            throw error;
        }
    }
}

export default QRCodeService;