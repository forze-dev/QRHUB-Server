/**
 * ScanService
 * Бізнес-логіка для відстеження QR сканувань
 * 
 * Відповідальність:
 * - Обробка сканування QR коду
 * - Збір device та geo інформації
 * - Створення QRScan запису
 * - Інкремент статистики QRCode
 * - Перевірка унікальності скану
 */

import QRCode from '../models/QRCode.js';
import QRScan from '../models/QRScan.js';
import { parseUserAgent } from '../utils/deviceDetector.js';
import { getLocationFromIP, getClientIP } from '../utils/geolocation.js';
import { generateFingerprint } from '../utils/fingerprint.js';
import { logInfo, logSuccess, logError, logWarn } from '../utils/logger.js';
import { NotFoundError } from '../utils/errorHandler.js';

class ScanService {
    // ============================================
    // PROCESS QR SCAN
    // ============================================

    /**
     * Обробка сканування QR коду
     * 
     * @param {String} shortCode - Короткий код QR
     * @param {Object} scanData - Дані про скан з request
     * @param {String} scanData.ip - IP адреса
     * @param {String} scanData.userAgent - User-Agent
     * @param {String} scanData.referrer - Referrer URL
     * @returns {Promise<Object>} - { targetUrl, qrCode, scan }
     */
    async processScan(shortCode, scanData) {
        try {
            logInfo('Processing QR scan', { shortCode });

            // 1. Знайти QR код по shortCode
            const qrcode = await this.findActiveQRCode(shortCode);

            if (!qrcode) {
                throw new NotFoundError('QR код не знайдено або неактивний');
            }

            // 2. Зібрати device та geo інформацію
            const deviceInfo = this.getDeviceInfo(scanData.userAgent);
            const geoInfo = await this.getGeoInfo(scanData.ip);

            // 3. Генерувати fingerprint
            const fingerprint = generateFingerprint(
                scanData.ip,
                scanData.userAgent,
                new Date()
            );

            // 4. Перевірити чи це унікальний скан
            const isUnique = await this.isUniqueScan(qrcode._id, fingerprint);

            // 5. Створити QRScan запис
            const scan = await this.createScanRecord({
                qrCodeId: qrcode._id,
                businessId: qrcode.businessId,
                websiteId: qrcode.websiteId,
                ip: scanData.ip,
                userAgent: scanData.userAgent,
                referrer: scanData.referrer,
                deviceInfo,
                geoInfo,
                fingerprint
            });

            // 6. Оновити статистику QRCode
            await this.updateQRCodeStats(qrcode, isUnique);

            logSuccess('QR scan processed successfully', {
                qrCodeId: qrcode._id,
                shortCode,
                isUnique,
                device: deviceInfo.device,
                country: geoInfo.country
            });

            return {
                targetUrl: qrcode.targetUrl,
                qrCode: {
                    id: qrcode._id,
                    name: qrcode.name,
                    shortCode: qrcode.shortCode
                },
                scan: {
                    id: scan._id,
                    isUnique,
                    device: deviceInfo.device,
                    location: `${geoInfo.city}, ${geoInfo.country}`
                }
            };

        } catch (error) {
            logError('Failed to process QR scan', {
                shortCode,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // FIND ACTIVE QR CODE
    // ============================================

    /**
     * Знаходить активний QR код по shortCode
     * 
     * @param {String} shortCode - Короткий код
     * @returns {Promise<Object|null>} - QR код або null
     */
    async findActiveQRCode(shortCode) {
        try {
            logInfo('Finding QR code by shortCode', { shortCode });

            const qrcode = await QRCode.findByShortCode(shortCode);

            if (!qrcode) {
                logWarn('QR code not found', { shortCode });
                return null;
            }

            // Перевірка чи активний
            if (!qrcode.isActiveStatus()) {
                logWarn('QR code is not active', {
                    shortCode,
                    status: qrcode.status,
                    isActive: qrcode.isActive
                });
                return null;
            }

            return qrcode;

        } catch (error) {
            logError('Failed to find QR code', {
                shortCode,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // GET DEVICE INFO
    // ============================================

    /**
     * Отримує інформацію про пристрій з User-Agent
     * 
     * @param {String} userAgent - User-Agent string
     * @returns {Object} - { device, browser, os, userAgent }
     */
    getDeviceInfo(userAgent) {
        try {
            if (!userAgent) {
                logWarn('Missing User-Agent for device detection');
                return {
                    device: 'Other',
                    browser: 'Unknown',
                    os: 'Unknown',
                    userAgent: 'Unknown'
                };
            }

            return parseUserAgent(userAgent);

        } catch (error) {
            logError('Failed to parse device info', {
                error: error.message
            });
            return {
                device: 'Other',
                browser: 'Unknown',
                os: 'Unknown',
                userAgent: userAgent || 'Unknown'
            };
        }
    }

    // ============================================
    // GET GEO INFO
    // ============================================

    /**
     * Отримує геолокацію по IP адресі
     * 
     * @param {String} ip - IP адреса
     * @returns {Promise<Object>} - { country, city, region }
     */
    async getGeoInfo(ip) {
        try {
            if (!ip) {
                logWarn('Missing IP for geolocation');
                return {
                    country: 'Unknown',
                    city: 'Unknown',
                    region: 'Unknown'
                };
            }

            const location = await getLocationFromIP(ip);

            return {
                country: location.country || 'Unknown',
                city: location.city || 'Unknown',
                region: location.region || 'Unknown'
            };

        } catch (error) {
            logError('Failed to get geo info', {
                ip,
                error: error.message
            });
            return {
                country: 'Unknown',
                city: 'Unknown',
                region: 'Unknown'
            };
        }
    }

    // ============================================
    // CHECK UNIQUE SCAN
    // ============================================

    /**
     * Перевіряє чи це унікальний скан сьогодні
     * 
     * @param {String} qrCodeId - ID QR коду
     * @param {String} fingerprint - Fingerprint користувача
     * @returns {Promise<Boolean>} - true якщо унікальний
     */
    async isUniqueScan(qrCodeId, fingerprint) {
        try {
            // Використовуємо static method з QRScan model
            const isUnique = await QRScan.isUniqueScanToday(qrCodeId, fingerprint);

            logInfo('Checked scan uniqueness', {
                qrCodeId,
                isUnique
            });

            return isUnique;

        } catch (error) {
            logError('Failed to check scan uniqueness', {
                qrCodeId,
                error: error.message
            });
            // Якщо помилка - вважаємо унікальним (optimistic)
            return true;
        }
    }

    // ============================================
    // CREATE SCAN RECORD
    // ============================================

    /**
     * Створює запис про сканування в БД
     * 
     * @param {Object} scanData - Дані про скан
     * @returns {Promise<Object>} - Створений QRScan документ
     */
    async createScanRecord(scanData) {
        try {
            logInfo('Creating scan record', {
                qrCodeId: scanData.qrCodeId,
                device: scanData.deviceInfo.device
            });

            const scan = await QRScan.create({
                qrCodeId: scanData.qrCodeId,
                businessId: scanData.businessId,
                websiteId: scanData.websiteId,

                // Час
                scannedAt: new Date(),

                // Геолокація
                country: scanData.geoInfo.country,
                city: scanData.geoInfo.city,
                ipAddress: scanData.ip,

                // Пристрій
                device: scanData.deviceInfo.device,
                browser: scanData.deviceInfo.browser,
                os: scanData.deviceInfo.os,
                userAgent: scanData.deviceInfo.userAgent,

                // Fingerprint
                fingerprint: scanData.fingerprint,

                // Додаткове
                referrer: scanData.referrer || null
            });

            logSuccess('Scan record created', {
                scanId: scan._id,
                qrCodeId: scanData.qrCodeId
            });

            return scan;

        } catch (error) {
            logError('Failed to create scan record', {
                qrCodeId: scanData.qrCodeId,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // UPDATE QR CODE STATS
    // ============================================

    /**
     * Оновлює статистику QR коду
     * 
     * @param {Object} qrcode - QR код документ
     * @param {Boolean} isUnique - Чи це унікальний скан
     * @returns {Promise<void>}
     */
    async updateQRCodeStats(qrcode, isUnique) {
        try {
            logInfo('Updating QR code stats', {
                qrCodeId: qrcode._id,
                isUnique
            });

            // Використовуємо instance method з QRCode model
            await qrcode.incrementScans(isUnique);

            logSuccess('QR code stats updated', {
                qrCodeId: qrcode._id,
                totalScans: qrcode.totalScans + 1,
                uniqueScans: isUnique ? qrcode.uniqueScans + 1 : qrcode.uniqueScans
            });

        } catch (error) {
            logError('Failed to update QR code stats', {
                qrCodeId: qrcode._id,
                error: error.message
            });
            // Не кидаємо помилку, щоб не блокувати redirect
            // Статистика може оновитись пізніше
        }
    }

    // ============================================
    // GET SCAN ANALYTICS (для майбутнього)
    // ============================================

    /**
     * Отримує базову аналітику сканувань
     * 
     * @param {String} qrCodeId - ID QR коду
     * @returns {Promise<Object>} - Статистика
     */
    async getScanAnalytics(qrCodeId) {
        try {
            logInfo('Getting scan analytics', { qrCodeId });

            const [totalScans, uniqueScans] = await Promise.all([
                QRScan.countByQRCode(qrCodeId),
                QRScan.countUniqueByQRCode(qrCodeId)
            ]);

            return {
                totalScans,
                uniqueScans,
                repeatScans: totalScans - uniqueScans
            };

        } catch (error) {
            logError('Failed to get scan analytics', {
                qrCodeId,
                error: error.message
            });
            throw error;
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Витягує дані для скану з Express request
     * 
     * @param {Object} req - Express request object
     * @returns {Object} - { ip, userAgent, referrer }
     */
    extractScanDataFromRequest(req) {
        return {
            ip: getClientIP(req),
            userAgent: req.headers['user-agent'] || 'Unknown',
            referrer: req.headers['referer'] || req.headers['referrer'] || null
        };
    }

    /**
     * Перевіряє чи дозволено сканувати з цього IP (rate limiting)
     * Для захисту від спаму
     * 
     * @param {String} ip - IP адреса
     * @param {String} qrCodeId - ID QR коду
     * @returns {Promise<Boolean>} - true якщо дозволено
     */
    async isRateLimitAllowed(ip, qrCodeId) {
        try {
            // Перевіряємо скільки разів цей IP сканував за останню хвилину
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

            const recentScans = await QRScan.countDocuments({
                qrCodeId,
                ipAddress: ip,
                scannedAt: { $gte: oneMinuteAgo }
            });

            // Максимум 10 сканів за хвилину з одного IP
            const maxScansPerMinute = 10;

            if (recentScans >= maxScansPerMinute) {
                logWarn('Rate limit exceeded', {
                    ip,
                    qrCodeId,
                    recentScans
                });
                return false;
            }

            return true;

        } catch (error) {
            logError('Failed to check rate limit', {
                ip,
                qrCodeId,
                error: error.message
            });
            // Якщо помилка - дозволяємо (optimistic)
            return true;
        }
    }
}

export default ScanService;