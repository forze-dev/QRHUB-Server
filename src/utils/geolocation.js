/**
 * Geolocation Utility
 * Визначення географічного розташування по IP адресі
 * 
 * Використовує безкоштовний API ip-api.com для отримання:
 * - Країни (country)
 * - Міста (city)
 * - Регіону (region)
 * - Координат (lat, lon)
 * 
 * Відповідальність:
 * - Запит до IP API
 * - Кешування результатів (опціонально)
 * - Fallback до Unknown при помилках
 */

import axios from 'axios';
import { logInfo, logSuccess, logWarn, logError } from './logger.js';
import { GEOLOCATION } from '../config/constants.js';

// ============================================
// CONFIGURATION
// ============================================

const { IP_API_ENDPOINTS, REQUEST_TIMEOUT, DEFAULT_LOCATION } = GEOLOCATION

// ============================================
// GET LOCATION FROM IP
// ============================================

/**
 * Отримує геолокацію по IP адресі
 * 
 * @param {String} ip - IP адреса (IPv4 або IPv6)
 * @returns {Promise<Object>} - { country, city, region, lat, lon }
 */
export async function getLocationFromIP(ip) {
    try {
        // Валідація IP
        if (!ip || !isValidIP(ip)) {
            logWarn('Invalid IP address for geolocation', { ip });
            return DEFAULT_LOCATION;
        }

        // Перевірка локальних/приватних IP
        if (isPrivateIP(ip) || isLocalIP(ip)) {
            logInfo('Private/Local IP detected, skipping geolocation', { ip });
            return {
                ...DEFAULT_LOCATION,
                country: 'Local',
                city: 'Local'
            };
        }

        logInfo('Fetching geolocation for IP', { ip });

        // Спроба отримати дані з primary API
        try {
            const location = await fetchFromPrimaryAPI(ip);
            if (location) {
                logSuccess('Geolocation fetched successfully', { ip, country: location.country, city: location.city });
                return location;
            }
        } catch (primaryError) {
            logWarn('Primary IP API failed, trying backup', {
                ip,
                error: primaryError.message
            });

            // Спроба з backup API
            try {
                const location = await fetchFromBackupAPI(ip);
                if (location) {
                    logSuccess('Geolocation fetched from backup API', { ip, country: location.country });
                    return location;
                }
            } catch (backupError) {
                logError('Backup IP API also failed', {
                    ip,
                    error: backupError.message
                });
            }
        }

        // Якщо всі API провалились
        logError('All geolocation APIs failed', { ip });
        return DEFAULT_LOCATION;

    } catch (error) {
        logError('Failed to get location from IP', {
            ip,
            error: error.message
        });
        return DEFAULT_LOCATION;
    }
}

// ============================================
// FETCH FROM PRIMARY API (ip-api.com)
// ============================================

/**
 * Запит до primary API (ip-api.com)
 * Безкоштовний, 45 запитів/хвилину
 * 
 * @param {String} ip - IP адреса
 * @returns {Promise<Object|null>}
 */
async function fetchFromPrimaryAPI(ip) {
    try {
        const url = `${IP_API_ENDPOINTS.PRIMARY}/${ip}`;

        const response = await axios.get(url, {
            timeout: REQUEST_TIMEOUT,
            params: {
                fields: 'status,country,city,regionName,lat,lon' // Тільки потрібні поля
            }
        });

        // Перевірка статусу відповіді
        if (response.data.status === 'fail') {
            logWarn('IP API returned fail status', {
                ip,
                message: response.data.message
            });
            return null;
        }

        // Формування результату
        return {
            country: response.data.country || 'Unknown',
            city: response.data.city || 'Unknown',
            region: response.data.regionName || 'Unknown',
            lat: response.data.lat || null,
            lon: response.data.lon || null
        };

    } catch (error) {
        logError('Primary API request failed', {
            ip,
            error: error.message
        });
        throw error;
    }
}

// ============================================
// FETCH FROM BACKUP API
// ============================================

/**
 * Запит до backup API (ipapi.co)
 * 1000 запитів/день
 * 
 * @param {String} ip - IP адреса
 * @returns {Promise<Object|null>}
 */
async function fetchFromBackupAPI(ip) {
    try {
        const url = `${IP_API_ENDPOINTS.BACKUP}/${ip}/json/`;

        const response = await axios.get(url, {
            timeout: REQUEST_TIMEOUT
        });

        // Формування результату
        return {
            country: response.data.country_name || 'Unknown',
            city: response.data.city || 'Unknown',
            region: response.data.region || 'Unknown',
            lat: response.data.latitude || null,
            lon: response.data.longitude || null
        };

    } catch (error) {
        logError('Backup API request failed', {
            ip,
            error: error.message
        });
        throw error;
    }
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Перевіряє чи валідний формат IP адреси
 * 
 * @param {String} ip - IP адреса
 * @returns {Boolean}
 */
export function isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;

    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;

    // IPv6 pattern (спрощений)
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (ipv4Pattern.test(ip)) {
        // Додаткова перевірка для IPv4 (кожен октет 0-255)
        const parts = ip.split('.');
        return parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
        });
    }

    return ipv6Pattern.test(ip);
}

/**
 * Перевіряє чи це приватний IP (RFC 1918)
 * 
 * @param {String} ip - IP адреса
 * @returns {Boolean}
 */
export function isPrivateIP(ip) {
    if (!ip) return false;

    // Приватні діапазони IPv4:
    // 10.0.0.0 - 10.255.255.255
    // 172.16.0.0 - 172.31.255.255
    // 192.168.0.0 - 192.168.255.255
    const privateRanges = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./
    ];

    return privateRanges.some(pattern => pattern.test(ip));
}

/**
 * Перевіряє чи це локальний IP
 * 
 * @param {String} ip - IP адреса
 * @returns {Boolean}
 */
export function isLocalIP(ip) {
    if (!ip) return false;

    // Локальні адреси:
    // 127.0.0.0/8 (localhost)
    // ::1 (IPv6 localhost)
    return ip === '127.0.0.1' ||
        ip === 'localhost' ||
        ip === '::1' ||
        ip.startsWith('127.');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Форматує локацію у читабельний рядок
 * 
 * @param {Object} location - Об'єкт з геолокацією
 * @returns {String} - "City, Country" або "Unknown"
 */
export function formatLocation(location) {
    if (!location) return 'Unknown';

    if (location.city === 'Unknown' && location.country === 'Unknown') {
        return 'Unknown';
    }

    if (location.city === 'Unknown') {
        return location.country;
    }

    if (location.country === 'Unknown') {
        return location.city;
    }

    return `${location.city}, ${location.country}`;
}

/**
 * Отримує IP адресу з request object
 * Враховує proxy та load balancers
 * 
 * @param {Object} req - Express request object
 * @returns {String} - IP адреса
 */
export function getClientIP(req) {
    // Перевірка заголовків від proxy/load balancer
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        // x-forwarded-for може містити список IP, беремо перший
        return forwarded.split(',')[0].trim();
    }

    // Cloudflare
    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'];
    }

    // AWS ELB
    if (req.headers['x-real-ip']) {
        return req.headers['x-real-ip'];
    }

    // Стандартний спосіб
    return req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'Unknown';
}

/**
 * Batch запит для множинних IP (для оптимізації)
 * 
 * @param {Array<String>} ips - Масив IP адрес
 * @returns {Promise<Array<Object>>} - Масив локацій
 */
export async function getLocationsBatch(ips) {
    try {
        // ip-api.com підтримує batch запити (до 100 IP за раз)
        const url = 'http://ip-api.com/batch';

        const response = await axios.post(url, ips, {
            timeout: REQUEST_TIMEOUT * 2,
            params: {
                fields: 'status,query,country,city,regionName,lat,lon'
            }
        });

        return response.data.map(item => {
            if (item.status === 'fail') {
                return DEFAULT_LOCATION;
            }

            return {
                country: item.country || 'Unknown',
                city: item.city || 'Unknown',
                region: item.regionName || 'Unknown',
                lat: item.lat || null,
                lon: item.lon || null
            };
        });

    } catch (error) {
        logError('Batch geolocation request failed', {
            count: ips.length,
            error: error.message
        });

        // Fallback: повертаємо дефолтні значення для всіх
        return ips.map(() => DEFAULT_LOCATION);
    }
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    getLocationFromIP,
    isValidIP,
    isPrivateIP,
    isLocalIP,
    formatLocation,
    getClientIP,
    getLocationsBatch
};