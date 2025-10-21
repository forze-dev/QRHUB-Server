/**
 * Device Detector Utility
 * Парсинг User-Agent для визначення типу пристрою, браузера та ОС
 * 
 * Використовує ua-parser-js для детального розбору User-Agent string
 * 
 * Відповідальність:
 * - Парсинг User-Agent
 * - Визначення типу пристрою (iOS/Android/Desktop/Other)
 * - Витягування інформації про браузер та ОС
 */

import UAParser from 'ua-parser-js';
import { logInfo, logWarn, logError } from './logger.js';
import { DEVICE_TYPE } from '../config/constants.js';

// ============================================
// PARSE USER AGENT
// ============================================

/**
 * Парсить User-Agent string та повертає детальну інформацію
 * 
 * @param {String} userAgentString - User-Agent з req.headers['user-agent']
 * @returns {Object} - { device, browser, os, userAgent }
 */
export function parseUserAgent(userAgentString) {
    try {
        // Перевірка валідності
        if (!userAgentString || typeof userAgentString !== 'string') {
            logWarn('Invalid User-Agent string', { userAgentString });
            return getDefaultDeviceInfo(userAgentString);
        }

        // Ініціалізація парсера
        const parser = new UAParser(userAgentString);
        const result = parser.getResult();

        logInfo('User-Agent parsed successfully', {
            device: result.device.type || 'unknown',
            os: result.os.name,
            browser: result.browser.name
        });

        // Формування результату
        return {
            device: detectDeviceType(result),
            browser: result.browser.name || 'Unknown',
            os: formatOS(result.os),
            userAgent: userAgentString
        };

    } catch (error) {
        logError('Failed to parse User-Agent', {
            userAgentString,
            error: error.message
        });
        return getDefaultDeviceInfo(userAgentString);
    }
}

// ============================================
// DETECT DEVICE TYPE
// ============================================

/**
 * Визначає тип пристрою на основі parsed результату
 * 
 * @param {Object} parsedResult - Результат від UAParser
 * @returns {String} - iOS | Android | Desktop | Other
 */
function detectDeviceType(parsedResult) {
    try {
        const deviceType = parsedResult.device.type; // mobile, tablet, etc
        const osName = parsedResult.os.name;

        // Мобільні пристрої
        if (deviceType === 'mobile' || deviceType === 'tablet') {
            if (osName === 'iOS') {
                return DEVICE_TYPE.IOS;
            }
            if (osName === 'Android') {
                return DEVICE_TYPE.ANDROID;
            }
            // Інші мобільні ОС (Windows Phone, BlackBerry, etc)
            return DEVICE_TYPE.OTHER;
        }

        // Desktop (якщо deviceType не визначено, то це desktop)
        if (!deviceType || deviceType === 'desktop') {
            // Перевіряємо чи це не мобільна ОС на десктопі (edge case)
            if (osName === 'iOS' || osName === 'Android') {
                return osName === 'iOS' ? DEVICE_TYPE.IOS : DEVICE_TYPE.ANDROID;
            }
            return DEVICE_TYPE.DESKTOP;
        }

        // Інші типи (SmartTV, Console, Wearable, etc)
        return DEVICE_TYPE.OTHER;

    } catch (error) {
        logError('Error detecting device type', { error: error.message });
        return DEVICE_TYPE.OTHER;
    }
}

// ============================================
// FORMAT OS
// ============================================

/**
 * Форматує інформацію про ОС у читабельний вигляд
 * 
 * @param {Object} os - Об'єкт ОС від UAParser
 * @returns {String} - Форматований рядок (наприклад: "Windows 10", "iOS 15.1")
 */
function formatOS(os) {
    try {
        if (!os || !os.name) {
            return 'Unknown';
        }

        // Якщо є версія - додаємо її
        if (os.version) {
            return `${os.name} ${os.version}`;
        }

        return os.name;

    } catch (error) {
        logError('Error formatting OS', { error: error.message });
        return 'Unknown';
    }
}

// ============================================
// GET DEFAULT DEVICE INFO
// ============================================

/**
 * Повертає дефолтну інформацію про пристрій у разі помилки парсингу
 * 
 * @param {String} userAgentString - Оригінальний User-Agent
 * @returns {Object} - Дефолтний об'єкт device info
 */
function getDefaultDeviceInfo(userAgentString) {
    return {
        device: DEVICE_TYPE.OTHER,
        browser: 'Unknown',
        os: 'Unknown',
        userAgent: userAgentString || 'Unknown'
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Перевіряє чи це мобільний пристрій (iOS або Android)
 * 
 * @param {Object} deviceInfo - Об'єкт з parseUserAgent
 * @returns {Boolean}
 */
export function isMobileDevice(deviceInfo) {
    return deviceInfo.device === DEVICE_TYPE.IOS ||
        deviceInfo.device === DEVICE_TYPE.ANDROID;
}

/**
 * Перевіряє чи це Desktop
 * 
 * @param {Object} deviceInfo - Об'єкт з parseUserAgent
 * @returns {Boolean}
 */
export function isDesktopDevice(deviceInfo) {
    return deviceInfo.device === DEVICE_TYPE.DESKTOP;
}

/**
 * Перевіряє чи це iOS пристрій
 * 
 * @param {Object} deviceInfo - Об'єкт з parseUserAgent
 * @returns {Boolean}
 */
export function isIOSDevice(deviceInfo) {
    return deviceInfo.device === DEVICE_TYPE.IOS;
}

/**
 * Перевіряє чи це Android пристрій
 * 
 * @param {Object} deviceInfo - Об'єкт з parseUserAgent
 * @returns {Boolean}
 */
export function isAndroidDevice(deviceInfo) {
    return deviceInfo.device === DEVICE_TYPE.ANDROID;
}

/**
 * Отримує тільки тип пристрою зі string User-Agent (швидкий метод)
 * 
 * @param {String} userAgentString - User-Agent string
 * @returns {String} - Device type
 */
export function getDeviceTypeQuick(userAgentString) {
    if (!userAgentString) return DEVICE_TYPE.OTHER;

    const ua = userAgentString.toLowerCase();

    // iOS (iPhone, iPad, iPod)
    if (/iphone|ipad|ipod/.test(ua)) {
        return DEVICE_TYPE.IOS;
    }

    // Android
    if (/android/.test(ua)) {
        return DEVICE_TYPE.ANDROID;
    }

    // Desktop indicators
    if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) {
        return DEVICE_TYPE.DESKTOP;
    }

    // Mobile indicators (generic)
    if (/mobile/.test(ua)) {
        return DEVICE_TYPE.OTHER;
    }

    // Default to Desktop
    return DEVICE_TYPE.DESKTOP;
}

/**
 * Отримує детальну інформацію про браузер
 * 
 * @param {String} userAgentString - User-Agent string
 * @returns {Object} - { name, version, major }
 */
export function getBrowserInfo(userAgentString) {
    try {
        const parser = new UAParser(userAgentString);
        const browser = parser.getBrowser();

        return {
            name: browser.name || 'Unknown',
            version: browser.version || 'Unknown',
            major: browser.major || 'Unknown'
        };

    } catch (error) {
        logError('Failed to get browser info', { error: error.message });
        return {
            name: 'Unknown',
            version: 'Unknown',
            major: 'Unknown'
        };
    }
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    parseUserAgent,
    detectDeviceType,
    isMobileDevice,
    isDesktopDevice,
    isIOSDevice,
    isAndroidDevice,
    getDeviceTypeQuick,
    getBrowserInfo
};