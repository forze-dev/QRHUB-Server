/**
 * Slug Generator Utility
 * Чиста функція для генерації slug без залежностей від моделей
 * 
 * Функціонал:
 * - Транслітерація (кирилиця → латиниця)
 * - Видалення спецсимволів
 * - Заміна пробілів на дефіси
 * - Lowercase
 * - Валідація довжини
 */

import { transliterate as tr, slugify } from 'transliteration';
import { SLUG_RULES } from '../config/constants.js';

/**
 * Таблиця транслітерації для кирилиці (українська + російська)
 * Використовується для кращої транслітерації специфічних літер
 */
const customTranslitMap = {
    // Українські специфічні
    'Є': 'Ye', 'є': 'ye',
    'І': 'I', 'і': 'i',
    'Ї': 'Yi', 'ї': 'yi',
    'Ґ': 'G', 'ґ': 'g',

    // Російські специфічні
    'Ё': 'Yo', 'ё': 'yo',
    'Ъ': '', 'ъ': '',
    'Ы': 'Y', 'ы': 'y',
    'Э': 'E', 'э': 'e',

    // Загальні кирилічні
    'А': 'A', 'а': 'a',
    'Б': 'B', 'б': 'b',
    'В': 'V', 'в': 'v',
    'Г': 'H', 'г': 'h',
    'Д': 'D', 'д': 'd',
    'Е': 'E', 'е': 'e',
    'Ж': 'Zh', 'ж': 'zh',
    'З': 'Z', 'з': 'z',
    'И': 'Y', 'и': 'y',
    'Й': 'Y', 'й': 'y',
    'К': 'K', 'к': 'k',
    'Л': 'L', 'л': 'l',
    'М': 'M', 'м': 'm',
    'Н': 'N', 'н': 'n',
    'О': 'O', 'о': 'o',
    'П': 'P', 'п': 'p',
    'Р': 'R', 'р': 'r',
    'С': 'S', 'с': 's',
    'Т': 'T', 'т': 't',
    'У': 'U', 'у': 'u',
    'Ф': 'F', 'ф': 'f',
    'Х': 'Kh', 'х': 'kh',
    'Ц': 'Ts', 'ц': 'ts',
    'Ч': 'Ch', 'ч': 'ch',
    'Ш': 'Sh', 'ш': 'sh',
    'Щ': 'Shch', 'щ': 'shch',
    'Ь': '', 'ь': '',
    'Ю': 'Yu', 'ю': 'yu',
    'Я': 'Ya', 'я': 'ya'
};

/**
 * Генерує slug з тексту
 * 
 * @param {String} text - Вхідний текст
 * @param {Object} options - Опції генерації
 * @param {Boolean} options.lowercase - Перетворити в lowercase (default: true)
 * @param {String} options.separator - Роздільник (default: '-')
 * @param {Number} options.maxLength - Максимальна довжина (default: 100)
 * @returns {String} - Згенерований slug
 * 
 * @example
 * generateSlug('Ресторан Балувана Галя')
 * // => 'restoran-baluvana-galya'
 * 
 * generateSlug('Café "Le Monde" & Bistro')
 * // => 'cafe-le-monde-bistro'
 */
export function generateSlug(text, options = {}) {
    const {
        lowercase = true,
        separator = '-',
        maxLength = SLUG_RULES.MAX_LENGTH
    } = options;

    if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
    }

    // 1. Транслітерація кирилиці
    let slug = transliterate(text);

    // 2. Використовуємо slugify з transliteration для очищення
    slug = slugify(slug, {
        lowercase: lowercase,
        separator: separator,
        replace: {
            // Додаткові заміни
            '&': 'and',
            '@': 'at',
            '#': 'number',
            '%': 'percent',
            '+': 'plus',
            '=': 'equals',
            '<': 'less',
            '>': 'greater'
        },
        trim: true
    });

    // 3. Видаляємо всі символи окрім літер, цифр та дефісів
    slug = slug.replace(/[^a-z0-9-]/gi, '');

    // 4. Замінюємо множинні дефіси на один
    slug = slug.replace(/-+/g, '-');

    // 5. Видаляємо дефіси на початку та в кінці
    slug = slug.replace(/^-+|-+$/g, '');

    // 6. Обрізаємо до максимальної довжини
    if (slug.length > maxLength) {
        slug = slug.substring(0, maxLength);
        // Видаляємо дефіс в кінці якщо обрізали на ньому
        slug = slug.replace(/-+$/, '');
    }

    // 7. Валідація мінімальної довжини
    if (slug.length < SLUG_RULES.MIN_LENGTH) {
        throw new Error(`Slug must be at least ${SLUG_RULES.MIN_LENGTH} characters long`);
    }

    return slug;
}

/**
 * Транслітерує кирилицю в латиницю
 * 
 * @param {String} text - Текст для транслітерації
 * @returns {String} - Транслітерований текст
 * 
 * @example
 * transliterate('Ресторан')
 * // => 'Restoran'
 */
export function transliterate(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    let result = text;

    // Спочатку застосовуємо кастомну таблицю транслітерації
    Object.keys(customTranslitMap).forEach(char => {
        const replacement = customTranslitMap[char];
        result = result.split(char).join(replacement);
    });

    // Потім використовуємо бібліотеку для решти символів
    result = tr(result);

    return result;
}

/**
 * Валідує slug згідно правил
 * 
 * @param {String} slug - Slug для валідації
 * @returns {Object} - { valid: Boolean, errors: Array }
 * 
 * @example
 * validateSlug('restoran-galya')
 * // => { valid: true, errors: [] }
 * 
 * validateSlug('ab')
 * // => { valid: false, errors: ['Slug is too short'] }
 */
export function validateSlug(slug) {
    const errors = [];

    if (!slug || typeof slug !== 'string') {
        errors.push('Slug must be a non-empty string');
        return { valid: false, errors };
    }

    // Перевірка довжини
    if (slug.length < SLUG_RULES.MIN_LENGTH) {
        errors.push(`Slug must be at least ${SLUG_RULES.MIN_LENGTH} characters long`);
    }

    if (slug.length > SLUG_RULES.MAX_LENGTH) {
        errors.push(`Slug must not exceed ${SLUG_RULES.MAX_LENGTH} characters`);
    }

    // Перевірка паттерну (тільки lowercase, цифри, дефіси)
    if (!SLUG_RULES.PATTERN.test(slug)) {
        errors.push('Slug can only contain lowercase letters, numbers and hyphens');
    }

    // Перевірка зарезервованих slug
    if (SLUG_RULES.RESERVED_SLUGS.includes(slug)) {
        errors.push('This slug is reserved and cannot be used');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Перевіряє чи slug зарезервований
 * 
 * @param {String} slug - Slug для перевірки
 * @returns {Boolean} - true якщо зарезервований
 * 
 * @example
 * isReservedSlug('admin')
 * // => true
 * 
 * isReservedSlug('my-business')
 * // => false
 */
export function isReservedSlug(slug) {
    if (!slug || typeof slug !== 'string') {
        return false;
    }
    return SLUG_RULES.RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Додає числовий суфікс до slug
 * Використовується в BusinessService для генерації унікального slug
 * 
 * @param {String} baseSlug - Базовий slug
 * @param {Number} number - Число для додавання
 * @returns {String} - Slug з суфіксом
 * 
 * @example
 * addSuffix('restoran-galya', 2)
 * // => 'restoran-galya-2'
 */
export function addSuffix(baseSlug, number) {
    if (!baseSlug || typeof baseSlug !== 'string') {
        throw new Error('Base slug must be a non-empty string');
    }

    if (!Number.isInteger(number) || number < 1) {
        throw new Error('Number must be a positive integer');
    }

    return `${baseSlug}-${number}`;
}

/**
 * Видаляє числовий суфікс зі slug якщо є
 * 
 * @param {String} slug - Slug з можливим суфіксом
 * @returns {String} - Slug без суфіксу
 * 
 * @example
 * removeSuffix('restoran-galya-2')
 * // => 'restoran-galya'
 * 
 * removeSuffix('restoran-galya')
 * // => 'restoran-galya'
 */
export function removeSuffix(slug) {
    if (!slug || typeof slug !== 'string') {
        return '';
    }

    // Видаляємо суфікс типу -2, -3, -123 в кінці
    return slug.replace(/-\d+$/, '');
}

/**
 * Генерує random slug для тестування
 * 
 * @param {Number} length - Довжина slug (default: 10)
 * @returns {String} - Random slug
 * 
 * @example
 * generateRandomSlug(8)
 * // => 'a7k9m2x4'
 */
export function generateRandomSlug(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    generateSlug,
    transliterate,
    validateSlug,
    isReservedSlug,
    addSuffix,
    removeSuffix,
    generateRandomSlug
};