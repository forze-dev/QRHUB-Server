/**
 * Short Code Generator Utility
 * Генерація коротких унікальних кодів для QR redirects
 * 
 * Використовує nanoid для створення URL-safe, collision-resistant кодів
 * Формат: qrhub.online/s/abc123Xy
 */

import { nanoid, customAlphabet } from 'nanoid';
import { logInfo, logError } from './logger.js';
import { SHORT_CODE_SETTINGS } from '../config/constants.js';

// Отримуємо константи з config
const { SAFE_ALPHABET, DEFAULT_LENGTH, MIN_LENGTH, MAX_LENGTH } = SHORT_CODE_SETTINGS;

// ============================================
// GENERATE SHORT CODE
// ============================================

/**
 * Генерує короткий унікальний код для QR
 * 
 * @param {Number} length - Довжина коду (за замовчуванням 8)
 * @returns {String} - Згенерований короткий код (наприклад: "a7bX3mKp")
 */
export function generateShortCode(length = DEFAULT_LENGTH) {
    try {
        // Валідація довжини
        if (length < MIN_LENGTH || length > MAX_LENGTH) {
            logError('Invalid short code length', {
                length,
                min: MIN_LENGTH,
                max: MAX_LENGTH
            });
            length = DEFAULT_LENGTH;
        }

        // Генерація коду
        const shortCode = nanoid(length);

        logInfo('Short code generated', {
            shortCode,
            length: shortCode.length
        });

        return shortCode;

    } catch (error) {
        logError('Failed to generate short code', {
            error: error.message
        });
        // Fallback до простішого методу
        return generateFallbackCode(length);
    }
}

// ============================================
// GENERATE SAFE SHORT CODE
// ============================================

/**
 * Генерує короткий код БЕЗ схожих символів (0/O, 1/l/I)
 * Більш читабельний для друку на папері
 * 
 * @param {Number} length - Довжина коду
 * @returns {String} - Safe short code
 */
export function generateSafeShortCode(length = DEFAULT_LENGTH) {
    try {
        // Валідація
        if (length < MIN_LENGTH || length > MAX_LENGTH) {
            length = DEFAULT_LENGTH;
        }

        // Custom alphabet generator
        const generate = customAlphabet(SAFE_ALPHABET, length);
        const shortCode = generate();

        logInfo('Safe short code generated', {
            shortCode,
            length: shortCode.length
        });

        return shortCode;

    } catch (error) {
        logError('Failed to generate safe short code', {
            error: error.message
        });
        return generateFallbackCode(length);
    }
}

// ============================================
// GENERATE NUMERIC CODE
// ============================================

/**
 * Генерує тільки цифровий код (для спрощення введення)
 * 
 * @param {Number} length - Довжина коду (рекомендовано 6-8)
 * @returns {String} - Numeric code (наприклад: "748392")
 */
export function generateNumericCode(length = 6) {
    try {
        if (length < 4 || length > 12) {
            length = 6;
        }

        const generate = customAlphabet('0123456789', length);
        const numericCode = generate();

        logInfo('Numeric code generated', { numericCode });

        return numericCode;

    } catch (error) {
        logError('Failed to generate numeric code', {
            error: error.message
        });
        return Math.random().toString().slice(2, 2 + length);
    }
}

// ============================================
// GENERATE MEMORABLE CODE
// ============================================

/**
 * Генерує більш запам'ятовуваний код (lowercase + numbers)
 * 
 * @param {Number} length - Довжина коду
 * @returns {String} - Memorable code
 */
export function generateMemorableCode(length = DEFAULT_LENGTH) {
    try {
        if (length < MIN_LENGTH || length > MAX_LENGTH) {
            length = DEFAULT_LENGTH;
        }

        // Тільки lowercase літери та цифри (легше запам'ятати)
        const generate = customAlphabet('abcdefghijkmnpqrstuvwxyz23456789', length);
        const memorableCode = generate();

        logInfo('Memorable code generated', { memorableCode });

        return memorableCode;

    } catch (error) {
        logError('Failed to generate memorable code', {
            error: error.message
        });
        return generateFallbackCode(length);
    }
}

// ============================================
// GENERATE CUSTOM PREFIX CODE
// ============================================

/**
 * Генерує код з кастомним префіксом
 * Корисно для категоризації QR кодів
 * 
 * @param {String} prefix - Префікс (наприклад: "menu", "promo")
 * @param {Number} length - Довжина коду після префіксу
 * @returns {String} - Code з префіксом (наприклад: "menu-a7bX3m")
 */
export function generatePrefixedCode(prefix, length = 6) {
    try {
        // Валідація префіксу
        if (!prefix || typeof prefix !== 'string') {
            logError('Invalid prefix for code generation', { prefix });
            return generateShortCode(length);
        }

        // Очистка префіксу (тільки lowercase літери та цифри)
        const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (cleanPrefix.length === 0) {
            logError('Empty prefix after cleaning', { originalPrefix: prefix });
            return generateShortCode(length);
        }

        // Генерація основної частини
        const codePart = generateSafeShortCode(length);
        const prefixedCode = `${cleanPrefix}-${codePart}`;

        logInfo('Prefixed code generated', {
            prefix: cleanPrefix,
            code: prefixedCode
        });

        return prefixedCode;

    } catch (error) {
        logError('Failed to generate prefixed code', {
            prefix,
            error: error.message
        });
        return generateShortCode(length);
    }
}

// ============================================
// VALIDATE SHORT CODE
// ============================================

/**
 * Валідація формату короткого коду
 * 
 * @param {String} code - Код для перевірки
 * @returns {Boolean} - true якщо код валідний
 */
export function validateShortCode(code) {
    try {
        // Перевірка типу
        if (!code || typeof code !== 'string') {
            return false;
        }

        // Перевірка довжини
        if (code.length < MIN_LENGTH || code.length > MAX_LENGTH) {
            return false;
        }

        // Перевірка формату (тільки літери, цифри, дефіс)
        const codePattern = /^[a-zA-Z0-9-]+$/;
        if (!codePattern.test(code)) {
            return false;
        }

        // Перевірка що не складається тільки з дефісів
        if (code.replace(/-/g, '').length === 0) {
            return false;
        }

        return true;

    } catch (error) {
        logError('Short code validation error', {
            code,
            error: error.message
        });
        return false;
    }
}

// ============================================
// FALLBACK CODE GENERATOR
// ============================================

/**
 * Fallback метод генерації коду якщо nanoid не працює
 * Використовує Math.random() та timestamp
 * 
 * @param {Number} length - Довжина коду
 * @returns {String} - Згенерований код
 */
function generateFallbackCode(length = DEFAULT_LENGTH) {
    try {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, length);
        const fallbackCode = (timestamp + randomPart).substring(0, length);

        logInfo('Fallback code generated', { fallbackCode });

        return fallbackCode;

    } catch (error) {
        logError('Fallback code generation failed', {
            error: error.message
        });
        // Останній варіант
        return 'error' + Date.now().toString(36).slice(-4);
    }
}

// ============================================
// ESTIMATE COLLISION PROBABILITY
// ============================================

/**
 * Оцінює ймовірність колізії для заданої довжини коду
 * Корисно для вибору оптимальної довжини
 * 
 * @param {Number} length - Довжина коду
 * @param {Number} totalCodes - Очікувана кількість кодів
 * @returns {Object} - Інформація про ймовірність колізії
 */
export function estimateCollisionProbability(length, totalCodes = 1000000) {
    try {
        // Кількість можливих комбінацій
        const alphabetSize = 62; // a-z, A-Z, 0-9
        const totalPossibleCodes = Math.pow(alphabetSize, length);

        // Birthday paradox formula
        const probability = 1 - Math.exp(-(totalCodes * (totalCodes - 1)) / (2 * totalPossibleCodes));

        const result = {
            codeLength: length,
            alphabetSize,
            totalPossibleCodes,
            expectedCodes: totalCodes,
            collisionProbability: probability,
            collisionPercentage: (probability * 100).toFixed(6) + '%',
            recommendation: probability < 0.000001 ? 'Safe' : 'Consider increasing length'
        };

        logInfo('Collision probability estimated', result);

        return result;

    } catch (error) {
        logError('Failed to estimate collision probability', {
            error: error.message
        });
        return null;
    }
}

// ============================================
// GET RECOMMENDED LENGTH
// ============================================

/**
 * Рекомендує оптимальну довжину коду базуючись на очікуваній кількості
 * 
 * @param {Number} expectedCodes - Очікувана кількість кодів
 * @returns {Number} - Рекомендована довжина
 */
export function getRecommendedLength(expectedCodes) {
    if (expectedCodes < 1000) return 6;        // ~56 млрд комбінацій
    if (expectedCodes < 10000) return 7;       // ~3.5 трлн комбінацій
    if (expectedCodes < 100000) return 8;      // ~218 трлн комбінацій
    if (expectedCodes < 1000000) return 9;     // ~13.5 квадрлн комбінацій
    return 10;                                  // ~839 квадрлн комбінацій
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    generateShortCode,
    generateSafeShortCode,
    generateNumericCode,
    generateMemorableCode,
    generatePrefixedCode,
    validateShortCode,
    estimateCollisionProbability,
    getRecommendedLength,
    MIN_LENGTH,
    MAX_LENGTH,
    DEFAULT_LENGTH
};