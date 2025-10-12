/**
 * Slug Generator Utility
 * Генерація slug для URL з транслітерацією кирилиці
 * 
 * Приклад:
 * "Ресторан Балувана Галя" → "restoran-baluvana-galya"
 */

import { transliterate } from 'transliteration';

/**
 * Генерує slug з тексту
 * @param {String} text - Текст для конвертації
 * @param {Object} options - Опції генерації
 * @returns {String} - Згенерований slug
 */
function generateSlug(text, options = {}) {
    const {
        lowercase = true,
        separator = '-',
        maxLength = 100
    } = options;

    if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
    }

    // 1. Транслітерація (кирилиця → латиниця)
    let slug = transliterate(text);

    // 2. Lowercase якщо потрібно
    if (lowercase) {
        slug = slug.toLowerCase();
    }

    // 3. Видаляємо спецсимволи (залишаємо тільки букви, цифри, пробіли, дефіси)
    slug = slug.replace(/[^\w\s-]/g, '');

    // 4. Замінюємо пробіли на separator
    slug = slug.replace(/\s+/g, separator);

    // 5. Видаляємо подвійні separator
    slug = slug.replace(new RegExp(`${separator}+`, 'g'), separator);

    // 6. Видаляємо separator на початку та в кінці
    slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');

    // 7. Обмежуємо довжину
    if (slug.length > maxLength) {
        slug = slug.substring(0, maxLength);
        // Видаляємо останній separator якщо він з'явився після обрізання
        slug = slug.replace(new RegExp(`${separator}+$`), '');
    }

    return slug;
}

/**
 * Генерує унікальний slug з додаванням числа
 * @param {String} baseSlug - Базовий slug
 * @param {Function} checkExists - Async функція перевірки чи існує slug
 * @param {Number} counter - Лічильник (для рекурсії)
 * @returns {Promise<String>} - Унікальний slug
 */
export async function generateUniqueSlug(baseSlug, checkExists, counter = 0) {
    const slug = counter === 0 ? baseSlug : `${baseSlug}-${counter}`;

    const exists = await checkExists(slug);

    if (!exists) {
        return slug;
    }

    // Рекурсивно шукаємо вільний slug
    return generateUniqueSlug(baseSlug, checkExists, counter + 1);
}

/**
 * Валідація slug
 * @param {String} slug - Slug для валідації
 * @returns {Boolean}
 */
export function isValidSlug(slug) {
    if (!slug || typeof slug !== 'string') {
        return false;
    }

    // Slug має містити тільки lowercase букви, цифри та дефіси
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
}

/**
 * Очищення slug (якщо користувач сам вводить)
 * @param {String} slug - Slug для очищення
 * @returns {String}
 */
export function sanitizeSlug(slug) {
    if (!slug || typeof slug !== 'string') {
        return '';
    }

    return slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '') // Видаляємо все крім букв, цифр, дефісів
        .replace(/-+/g, '-')         // Подвійні дефіси → один
        .replace(/^-+|-+$/g, '');    // Видаляємо дефіси на початку/кінці
}

// Default export
export default generateSlug;