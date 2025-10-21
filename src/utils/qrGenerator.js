/**
 * QR Code Generator Utility
 * Генерація QR кодів з використанням qrcode library
 * 
 * Функціонал:
 * - Генерація QR image у форматі Buffer (для S3 upload)
 * - Генерація Data URL (для preview)
 * - Підтримка кастомних кольорів
 * - Підтримка різних розмірів
 * - Error correction levels
 */

import QRCode from 'qrcode';
import { logInfo, logSuccess, logError } from './logger.js';
import { QR_CODE_SETTINGS } from '../config/constants.js';

// ============================================
// GENERATE QR CODE AS BUFFER
// ============================================

/**
 * Генерує QR код як Buffer для завантаження в S3
 * 
 * @param {String} url - URL який буде закодований в QR
 * @param {Object} options - Опції генерації
 * @param {String} options.primaryColor - Колір QR (#000000)
 * @param {String} options.backgroundColor - Колір фону (#FFFFFF)
 * @param {Number} options.width - Ширина QR в пікселях (500)
 * @param {Number} options.margin - Відступи (2)
 * @param {String} options.errorCorrectionLevel - L, M, Q, H (M)
 * @returns {Promise<Buffer>} - QR code image buffer
 */
export async function generateQRCodeBuffer(url, options = {}) {
    try {
        logInfo('Generating QR code buffer', { url, options });

        // Налаштування для генерації
        const qrOptions = {
            // Тип виводу
            type: 'png',

            // Error correction level
            // L - Low (7% correction)
            // M - Medium (15% correction) - default
            // Q - Quartile (25% correction)
            // H - High (30% correction)
            errorCorrectionLevel: options.errorCorrectionLevel || QR_CODE_SETTINGS.ERROR_CORRECTION_LEVEL,

            // Якість зображення (0.0 - 1.0)
            quality: 0.92,

            // Розмір
            width: options.width || QR_CODE_SETTINGS.DEFAULT_SIZE,

            // Відступи навколо QR (в модулях)
            margin: options.margin !== undefined ? options.margin : QR_CODE_SETTINGS.DEFAULT_MARGIN,

            // Кольори
            color: {
                dark: options.primaryColor || QR_CODE_SETTINGS.DEFAULT_COLORS.dark,
                light: options.backgroundColor || QR_CODE_SETTINGS.DEFAULT_COLORS.light
            }
        };

        // Генерація QR коду
        const buffer = await QRCode.toBuffer(url, qrOptions);

        logSuccess('QR code buffer generated', {
            url,
            size: buffer.length,
            width: qrOptions.width
        });

        return buffer;

    } catch (error) {
        logError('Failed to generate QR code buffer', {
            url,
            error: error.message
        });
        throw new Error(`QR generation failed: ${error.message}`);
    }
}

// ============================================
// GENERATE QR CODE AS DATA URL
// ============================================

/**
 * Генерує QR код як Data URL для preview у браузері
 * 
 * @param {String} url - URL який буде закодований в QR
 * @param {Object} options - Опції генерації
 * @returns {Promise<String>} - Data URL (data:image/png;base64,...)
 */
export async function generateQRCodeDataURL(url, options = {}) {
    try {
        logInfo('Generating QR code data URL', { url });

        const qrOptions = {
            errorCorrectionLevel: options.errorCorrectionLevel || QR_CODE_SETTINGS.ERROR_CORRECTION_LEVEL,
            width: options.width || QR_CODE_SETTINGS.DEFAULT_SIZE,
            margin: options.margin !== undefined ? options.margin : QR_CODE_SETTINGS.DEFAULT_MARGIN,
            color: {
                dark: options.primaryColor || QR_CODE_SETTINGS.DEFAULT_COLORS.dark,
                light: options.backgroundColor || QR_CODE_SETTINGS.DEFAULT_COLORS.light
            }
        };

        // Генерація Data URL
        const dataURL = await QRCode.toDataURL(url, qrOptions);

        logSuccess('QR code data URL generated', { url });

        return dataURL;

    } catch (error) {
        logError('Failed to generate QR code data URL', {
            url,
            error: error.message
        });
        throw new Error(`QR data URL generation failed: ${error.message}`);
    }
}

// ============================================
// GENERATE QR CODE AS SVG
// ============================================

/**
 * Генерує QR код як SVG string (для масштабованості)
 * 
 * @param {String} url - URL який буде закодований в QR
 * @param {Object} options - Опції генерації
 * @returns {Promise<String>} - SVG string
 */
export async function generateQRCodeSVG(url, options = {}) {
    try {
        logInfo('Generating QR code SVG', { url });

        const qrOptions = {
            type: 'svg',
            errorCorrectionLevel: options.errorCorrectionLevel || QR_CODE_SETTINGS.ERROR_CORRECTION_LEVEL,
            width: options.width || QR_CODE_SETTINGS.DEFAULT_SIZE,
            margin: options.margin !== undefined ? options.margin : QR_CODE_SETTINGS.DEFAULT_MARGIN,
            color: {
                dark: options.primaryColor || QR_CODE_SETTINGS.DEFAULT_COLORS.dark,
                light: options.backgroundColor || QR_CODE_SETTINGS.DEFAULT_COLORS.light
            }
        };

        // Генерація SVG
        const svg = await QRCode.toString(url, qrOptions);

        logSuccess('QR code SVG generated', { url });

        return svg;

    } catch (error) {
        logError('Failed to generate QR code SVG', {
            url,
            error: error.message
        });
        throw new Error(`QR SVG generation failed: ${error.message}`);
    }
}

// ============================================
// VALIDATE QR URL
// ============================================

/**
 * Валідація URL перед генерацією QR
 * 
 * @param {String} url - URL для перевірки
 * @returns {Boolean} - true якщо URL валідний
 */
export function validateQRUrl(url) {
    try {
        // Перевірка чи не порожній
        if (!url || typeof url !== 'string') {
            return false;
        }

        // Перевірка довжини (QR коди мають ліміт)
        if (url.length > 2048) {
            logError('URL too long for QR code', { length: url.length });
            return false;
        }

        // Перевірка формату URL
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(url)) {
            logError('Invalid URL format for QR code', { url });
            return false;
        }

        return true;

    } catch (error) {
        logError('URL validation error', {
            url,
            error: error.message
        });
        return false;
    }
}

// ============================================
// GENERATE QR WITH OPTIONS PRESET
// ============================================

/**
 * Генерує QR з преднал��штованими опціями для різних випадків
 */

/**
 * Малий QR (200x200) для мініатюр
 */
export async function generateSmallQR(url, options = {}) {
    return generateQRCodeBuffer(url, {
        ...options,
        width: 200,
        margin: 1
    });
}

/**
 * Середній QR (500x500) - за замовчуванням
 */
export async function generateMediumQR(url, options = {}) {
    return generateQRCodeBuffer(url, {
        ...options,
        width: 500,
        margin: 2
    });
}

/**
 * Великий QR (1000x1000) для друку
 */
export async function generateLargeQR(url, options = {}) {
    return generateQRCodeBuffer(url, {
        ...options,
        width: 1000,
        margin: 4,
        errorCorrectionLevel: 'H' // Високий рівень корекції для друку
    });
}

/**
 * QR для друку з високою якістю
 */
export async function generatePrintQR(url, options = {}) {
    return generateQRCodeBuffer(url, {
        ...options,
        width: 2000,
        margin: 4,
        errorCorrectionLevel: 'H'
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Отримати рекомендований error correction level базуючись на довжині URL
 * Довші URL потребують нижчого рівня корекції
 */
export function getRecommendedErrorCorrection(url) {
    const length = url.length;

    if (length < 100) return 'H';      // High - для коротких URL
    if (length < 500) return 'M';      // Medium - для середніх
    if (length < 1000) return 'L';     // Low - для довгих
    return 'L';
}

/**
 * Перевірка чи колір валідний hex
 */
export function isValidHexColor(color) {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Отримати розмір файлу у зручному форматі
 */
export function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    generateQRCodeBuffer,
    generateQRCodeDataURL,
    generateQRCodeSVG,
    validateQRUrl,
    generateSmallQR,
    generateMediumQR,
    generateLargeQR,
    generatePrintQR,
    getRecommendedErrorCorrection,
    isValidHexColor,
    formatFileSize
};