/**
 * QRHub Project Constants
 * Всі константи проекту згідно ТЗ
 */

// ============================================
// СТАТУСИ
// ============================================

// Статуси бізнесу
export const BUSINESS_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING_PAYMENT: 'pending_payment'
};

// Типи сайтів
export const WEBSITE_TYPE = {
    CARD: 'card',           // Візитка
    CATALOG: 'catalog',     // Каталог
    EXTERNAL: 'external'    // Зовнішній сайт
};

// Статуси сайту
export const WEBSITE_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DRAFT: 'draft'
};

// Статуси QR коду
export const QR_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ARCHIVED: 'archived'
};

// Типи пристроїв
export const DEVICE_TYPE = {
    IOS: 'iOS',
    ANDROID: 'Android',
    DESKTOP: 'Desktop',
    OTHER: 'Other'
};

// Типи заявок
export const REQUEST_TYPE = {
    CONTACT: 'contact',     // Форма зв'язку
    ORDER: 'order'          // Замовлення
};

// Статуси заявок
export const REQUEST_STATUS = {
    NEW: 'new',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// ============================================
// ТАРИФНІ ПЛАНИ (для майбутнього)
// ============================================

// Тарифні плани
export const SUBSCRIPTION_PLAN = {
    FREE: 'free',
    STARTER: 'starter',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
};

// Статуси підписки
export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    TRIAL: 'trial'
};

// Типи платежів
export const PAYMENT_TYPE = {
    SUBSCRIPTION: 'subscription',
    BUSINESS_CREATION: 'business_creation',
    DOMAIN: 'domain',
    CUSTOM_DEVELOPMENT: 'custom_development'
};

// Статуси платежів
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

// ============================================
// MVP ЛІМІТИ
// ============================================

export const MVP_LIMITS = {
    MAX_BUSINESSES_PER_USER: 1,      // Для MVP - тільки 1 бізнес
    MAX_WEBSITES_PER_BUSINESS: 1,    // Для MVP - тільки 1 сайт
    MAX_QR_CODES_PER_WEBSITE: 1,     // Для MVP - тільки 1 QR код
    MAX_PRODUCTS_PER_CATALOG: 50,    // Максимум товарів в каталозі
    MAX_FILE_SIZE: 5 * 1024 * 1024,  // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
};

// ============================================
// ТАРИФНІ ЛІМІТИ (для майбутнього)
// ============================================

export const PLAN_LIMITS = {
    starter: {
        maxBusinesses: -1,              // -1 = unlimited
        maxWebsitesPerBusiness: 1,
        maxQRCodesPerWebsite: 1,
        price: 5,                       // EUR
        creationFee: 10                 // EUR за створення бізнесу
    },
    pro: {
        maxBusinesses: -1,              // unlimited
        maxWebsitesPerBusiness: 3,
        maxQRCodesPerWebsite: 5,
        price: 20,                      // EUR
        creationFee: 7                  // EUR за створення (знижка 30%)
    },
    enterprise: {
        maxBusinesses: -1,              // unlimited
        maxWebsitesPerBusiness: -1,     // unlimited
        maxQRCodesPerWebsite: -1,       // unlimited
        price: 'custom',
        creationFee: 0                  // Безкоштовно для enterprise
    }
};

// ============================================
// ВАЛЮТИ
// ============================================

export const CURRENCY = {
    UAH: 'UAH',
    EUR: 'EUR',
    USD: 'USD'
};

export const DEFAULT_CURRENCY = CURRENCY.UAH;

// ============================================
// РЕФЕРАЛЬНА ПРОГРАМА (для майбутнього)
// ============================================

export const REFERRAL = {
    MAX_ACTIVE_REFERRALS: 3,         // Максимум активних рефералів
    DISCOUNT_TIERS: {
        1: 10,  // 1 реферал = 10% знижка
        2: 15,  // 2 реферали = 15% знижка
        3: 20   // 3 реферали = 20% знижка
    },
    MIN_SUBSCRIPTION_MONTHS: 3       // Мінімум оплачених місяців для активації
};

// ============================================
// QR CODE SETTINGS
// ============================================

export const QR_CODE_SETTINGS = {
    DEFAULT_SIZE: 500,               // px
    DEFAULT_MARGIN: 2,
    ERROR_CORRECTION_LEVEL: 'M',     // L, M, Q, H
    DEFAULT_COLORS: {
        dark: '#000000',
        light: '#FFFFFF'
    }
};

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// ============================================
// JWT
// ============================================

export const JWT = {
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    REFRESH_EXPIRES_IN: '30d'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Перевіряє чи валідний статус
 */
export const isValidStatus = (status, statusEnum) => {
    return Object.values(statusEnum).includes(status);
};

/**
 * Отримує ліміти для конкретного плану
 */
export const getPlanLimits = (plan) => {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
};

/**
 * Перевіряє чи досягнуто ліміт
 */
export const isLimitReached = (current, limit) => {
    if (limit === -1) return false; // Unlimited
    return current >= limit;
};

// ============================================
// BUSINESS-SPECIFIC CONSTANTS (додати до існуючих)
// ============================================

// Типи файлів для Business
export const BUSINESS_FILE_TYPES = {
    LOGO: {
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        FOLDER: 'logos'
    }
};

// Правила для slug
export const SLUG_RULES = {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
    PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // тільки lowercase, цифри, дефіси
    RESERVED_SLUGS: [
        'api', 'admin', 'auth', 'login', 'logout', 'register',
        'dashboard', 'settings', 'profile', 'help', 'support',
        'about', 'contact', 'terms', 'privacy', 'new', 'edit'
    ]
};

// Валідація контактів
export const CONTACT_VALIDATION = {
    PHONE: {
        MIN_LENGTH: 10,
        MAX_LENGTH: 15,
        PATTERN: /^\+?[1-9]\d{1,14}$/ // E.164 format
    },
    EMAIL: {
        PATTERN: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    }
};


// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    BUSINESS_STATUS,
    WEBSITE_TYPE,
    WEBSITE_STATUS,
    QR_STATUS,
    DEVICE_TYPE,
    REQUEST_TYPE,
    REQUEST_STATUS,
    SUBSCRIPTION_PLAN,
    SUBSCRIPTION_STATUS,
    PAYMENT_TYPE,
    PAYMENT_STATUS,
    MVP_LIMITS,
    PLAN_LIMITS,
    CURRENCY,
    DEFAULT_CURRENCY,
    REFERRAL,
    QR_CODE_SETTINGS,
    PAGINATION,
    JWT,
    isValidStatus,
    getPlanLimits,
    isLimitReached,
    BUSINESS_FILE_TYPES,
    SLUG_RULES,
    CONTACT_VALIDATION
};