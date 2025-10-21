/**
 * Fingerprint Utility
 * Генерація унікального fingerprint для відстеження користувачів
 * 
 * Fingerprint використовується для:
 * - Визначення унікальних vs повторних сканувань
 * - Підрахунку унікальних користувачів
 * - Аналітики без персональних даних
 * 
 * Відповідальність:
 * - Генерація hash на основі IP + User-Agent + Date
 * - Створення консистентних fingerprints
 * - Privacy-friendly tracking (без cookies)
 */

import crypto from 'crypto';
import { logInfo, logError } from './logger.js';
import { FINGERPRINT } from '../config/constants.js';

// ============================================
// CONFIGURATION
// ============================================


// Алгоритм хешування
const { HASH_ALGORITHM, DEFAULT_DATE_FORMAT, DATE_FORMAT } = FINGERPRINT;

// ============================================
// GENERATE FINGERPRINT
// ============================================

/**
 * Генерує fingerprint для відстеження унікальних користувачів
 * 
 * Fingerprint = SHA256(IP + UserAgent + Date)
 * 
 * @param {String} ip - IP адреса користувача
 * @param {String} userAgent - User-Agent string
 * @param {Date} date - Дата сканування (за замовчуванням: new Date())
 * @param {String} dateFormat - Формат дати (daily/hourly/monthly)
 * @returns {String} - Hex fingerprint (64 символи)
 */
export function generateFingerprint(ip, userAgent, date = new Date(), dateFormat = DEFAULT_DATE_FORMAT) {
    try {
        // Валідація вхідних даних
        if (!ip || !userAgent) {
            logError('Missing required data for fingerprint generation', {
                hasIP: !!ip,
                hasUserAgent: !!userAgent
            });
            throw new Error('IP та User-Agent є обов\'язковими для fingerprint');
        }

        // Форматування дати
        const formattedDate = formatDateForFingerprint(date, dateFormat);

        // Створення строки для хешування
        const data = `${ip}-${userAgent}-${formattedDate}`;

        // Генерація hash
        const hash = crypto
            .createHash(HASH_ALGORITHM)
            .update(data)
            .digest('hex');

        logInfo('Fingerprint generated', {
            ip: maskIP(ip), // Маскуємо IP в логах для privacy
            date: formattedDate,
            fingerprintLength: hash.length
        });

        return hash;

    } catch (error) {
        logError('Failed to generate fingerprint', {
            error: error.message
        });
        // Fallback: генеруємо випадковий fingerprint
        return generateRandomFingerprint();
    }
}

// ============================================
// FORMAT DATE FOR FINGERPRINT
// ============================================

/**
 * Форматує дату для fingerprint
 * 
 * @param {Date} date - Дата
 * @param {String} format - Формат (daily/hourly/monthly)
 * @returns {String} - Форматована дата
 */
function formatDateForFingerprint(date, format = DEFAULT_DATE_FORMAT) {
    try {
        if (!(date instanceof Date) || isNaN(date)) {
            date = new Date();
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');

        // Вибір формату
        switch (format) {
            case DATE_FORMAT.HOURLY:
                return `${year}-${month}-${day}-${hour}`;

            case DATE_FORMAT.MONTHLY:
                return `${year}-${month}`;

            case DATE_FORMAT.DAILY:
            default:
                return `${year}-${month}-${day}`;
        }

    } catch (error) {
        logError('Error formatting date for fingerprint', {
            error: error.message
        });
        // Fallback: повертаємо поточну дату в ISO форматі
        return new Date().toISOString().split('T')[0];
    }
}

// ============================================
// GENERATE RANDOM FINGERPRINT
// ============================================

/**
 * Генерує випадковий fingerprint (fallback)
 * 
 * @returns {String} - Випадковий hex string
 */
function generateRandomFingerprint() {
    try {
        return crypto.randomBytes(32).toString('hex');
    } catch (error) {
        logError('Failed to generate random fingerprint', {
            error: error.message
        });
        // Останній fallback
        return Date.now().toString(36) + Math.random().toString(36);
    }
}

// ============================================
// FINGERPRINT VARIANTS
// ============================================

/**
 * Генерує щоденний fingerprint (оновлюється кожен день)
 * 
 * @param {String} ip - IP адреса
 * @param {String} userAgent - User-Agent
 * @returns {String} - Fingerprint
 */
export function generateDailyFingerprint(ip, userAgent) {
    return generateFingerprint(ip, userAgent, new Date(), DATE_FORMAT.DAILY);
}

/**
 * Генерує погодинний fingerprint (оновлюється кожну годину)
 * Корисно для аналізу годин пік
 * 
 * @param {String} ip - IP адреса
 * @param {String} userAgent - User-Agent
 * @returns {String} - Fingerprint
 */
export function generateHourlyFingerprint(ip, userAgent) {
    return generateFingerprint(ip, userAgent, new Date(), DATE_FORMAT.HOURLY);
}

/**
 * Генерує місячний fingerprint (оновлюється кожен місяць)
 * 
 * @param {String} ip - IP адреса
 * @param {String} userAgent - User-Agent
 * @returns {String} - Fingerprint
 */
export function generateMonthlyFingerprint(ip, userAgent) {
    return generateFingerprint(ip, userAgent, new Date(), DATE_FORMAT.MONTHLY);
}

/**
 * Генерує персистентний fingerprint (не залежить від дати)
 * Використовується для довгострокового tracking
 * 
 * @param {String} ip - IP адреса
 * @param {String} userAgent - User-Agent
 * @returns {String} - Fingerprint
 */
export function generatePersistentFingerprint(ip, userAgent) {
    try {
        if (!ip || !userAgent) {
            throw new Error('Missing required data');
        }

        const data = `${ip}-${userAgent}`;

        return crypto
            .createHash(HASH_ALGORITHM)
            .update(data)
            .digest('hex');

    } catch (error) {
        logError('Failed to generate persistent fingerprint', {
            error: error.message
        });
        return generateRandomFingerprint();
    }
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Перевіряє чи валідний fingerprint
 * 
 * @param {String} fingerprint - Fingerprint для перевірки
 * @returns {Boolean}
 */
export function isValidFingerprint(fingerprint) {
    if (!fingerprint || typeof fingerprint !== 'string') {
        return false;
    }

    // SHA256 hash має довжину 64 hex символи
    const sha256Pattern = /^[a-f0-9]{64}$/i;

    return sha256Pattern.test(fingerprint);
}

/**
 * Порівнює два fingerprints
 * 
 * @param {String} fingerprint1 - Перший fingerprint
 * @param {String} fingerprint2 - Другий fingerprint
 * @returns {Boolean}
 */
export function compareFingerprints(fingerprint1, fingerprint2) {
    if (!fingerprint1 || !fingerprint2) {
        return false;
    }

    return fingerprint1.toLowerCase() === fingerprint2.toLowerCase();
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Маскує IP адресу для логування (privacy)
 * 
 * Приклад: 192.168.1.123 → 192.168.xxx.xxx
 * 
 * @param {String} ip - IP адреса
 * @returns {String} - Маскований IP
 */
function maskIP(ip) {
    if (!ip || typeof ip !== 'string') {
        return 'unknown';
    }

    // IPv4
    if (ip.includes('.')) {
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.xxx.xxx`;
        }
    }

    // IPv6 (маскуємо останні 4 групи)
    if (ip.includes(':')) {
        const parts = ip.split(':');
        if (parts.length >= 4) {
            const visible = parts.slice(0, 4);
            return `${visible.join(':')}:xxxx:xxxx:xxxx:xxxx`;
        }
    }

    return 'masked';
}

/**
 * Отримує короткий fingerprint (перші 16 символів)
 * Використовується для зручного відображення в UI
 * 
 * @param {String} fingerprint - Повний fingerprint
 * @returns {String} - Скорочений fingerprint
 */
export function getShortFingerprint(fingerprint) {
    if (!fingerprint || typeof fingerprint !== 'string') {
        return 'unknown';
    }

    return fingerprint.substring(0, 16);
}

/**
 * Генерує fingerprint з додатковими параметрами
 * Для більш точного tracking
 * 
 * @param {Object} params - Параметри для fingerprint
 * @param {String} params.ip - IP адреса
 * @param {String} params.userAgent - User-Agent
 * @param {String} params.acceptLanguage - Accept-Language header
 * @param {String} params.acceptEncoding - Accept-Encoding header
 * @param {Date} params.date - Дата
 * @returns {String} - Fingerprint
 */
export function generateEnhancedFingerprint(params) {
    try {
        const {
            ip,
            userAgent,
            acceptLanguage = '',
            acceptEncoding = '',
            date = new Date()
        } = params;

        if (!ip || !userAgent) {
            throw new Error('Missing required parameters');
        }

        const formattedDate = formatDateForFingerprint(date);

        // Додаємо більше параметрів для унікальності
        const data = [
            ip,
            userAgent,
            acceptLanguage,
            acceptEncoding,
            formattedDate
        ].join('-');

        return crypto
            .createHash(HASH_ALGORITHM)
            .update(data)
            .digest('hex');

    } catch (error) {
        logError('Failed to generate enhanced fingerprint', {
            error: error.message
        });
        return generateRandomFingerprint();
    }
}

/**
 * Генерує fingerprint з salt (для додаткової безпеки)
 * 
 * @param {String} ip - IP адреса
 * @param {String} userAgent - User-Agent
 * @param {String} salt - Salt string
 * @returns {String} - Fingerprint
 */
export function generateSaltedFingerprint(ip, userAgent, salt) {
    try {
        if (!ip || !userAgent || !salt) {
            throw new Error('Missing required parameters');
        }

        const formattedDate = formatDateForFingerprint(new Date());
        const data = `${salt}-${ip}-${userAgent}-${formattedDate}`;

        return crypto
            .createHash(HASH_ALGORITHM)
            .update(data)
            .digest('hex');

    } catch (error) {
        logError('Failed to generate salted fingerprint', {
            error: error.message
        });
        return generateRandomFingerprint();
    }
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    generateFingerprint,
    generateDailyFingerprint,
    generateHourlyFingerprint,
    generateMonthlyFingerprint,
    generatePersistentFingerprint,
    generateEnhancedFingerprint,
    generateSaltedFingerprint,
    isValidFingerprint,
    compareFingerprints,
    getShortFingerprint,
    DATE_FORMAT
};