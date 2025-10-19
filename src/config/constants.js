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
    // Business ліміти
    MAX_BUSINESSES_PER_USER: 1,

    // Website ліміти
    MAX_WEBSITES_PER_BUSINESS: 1,

    // Product ліміти
    MAX_PRODUCTS_PER_CATALOG: 50,

    // QR Code ліміти (для майбутнього)
    MAX_QR_CODES_PER_WEBSITE: 1
};

// ============================================
// ТИПИ ФАЙЛІВ ДЛЯ BUSINESS
// ============================================

export const BUSINESS_FILE_TYPES = {
    LOGO: {
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        FOLDER: 'logos'
    }
};

// ============================================
// ТИПИ ФАЙЛІВ ДЛЯ WEBSITE
// ============================================

export const WEBSITE_FILE_TYPES = {
    COVER: {
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        FOLDER: 'covers'
    }
};

// ============================================
// ТИПИ ФАЙЛІВ ДЛЯ PRODUCT
// ============================================

export const PRODUCT_FILE_TYPES = {
    IMAGE: {
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        MAX_SIZE: 3 * 1024 * 1024, // 3MB
        FOLDER: 'products'
    }
};

// ============================================
// ЛІМІТИ ДЛЯ ТАРИФІВ (для майбутнього)
// ============================================

export const PLAN_LIMITS = {
    starter: {
        maxBusinesses: -1,              // unlimited
        maxWebsitesPerBusiness: 1,
        maxQRCodesPerWebsite: 1,
        maxProductsPerCatalog: 50,
        price: 5,                       // EUR/місяць
        creationFee: 10                 // EUR за створення бізнесу
    },
    pro: {
        maxBusinesses: -1,              // unlimited
        maxWebsitesPerBusiness: 3,
        maxQRCodesPerWebsite: 5,
        maxProductsPerCatalog: 200,
        price: 20,                      // EUR/місяць
        creationFee: 7                  // EUR за створення бізнесу
    },
    enterprise: {
        maxBusinesses: -1,              // unlimited
        maxWebsitesPerBusiness: -1,     // unlimited
        maxQRCodesPerWebsite: -1,       // unlimited
        maxProductsPerCatalog: -1,      // unlimited
        price: 'custom',
        creationFee: 0
    }
};

// ============================================
// ВАЛЮТИ
// ============================================

export const CURRENCIES = {
    UAH: 'UAH',
    EUR: 'EUR',
    USD: 'USD'
};

// ============================================
// РОЗМІРИ ЗОБРАЖЕНЬ (для валідації)
// ============================================

export const IMAGE_DIMENSIONS = {
    LOGO: {
        MIN_WIDTH: 100,
        MIN_HEIGHT: 100,
        MAX_WIDTH: 2000,
        MAX_HEIGHT: 2000,
        RECOMMENDED_WIDTH: 500,
        RECOMMENDED_HEIGHT: 500
    },
    COVER: {
        MIN_WIDTH: 800,
        MIN_HEIGHT: 400,
        MAX_WIDTH: 3000,
        MAX_HEIGHT: 2000,
        RECOMMENDED_WIDTH: 1920,
        RECOMMENDED_HEIGHT: 1080
    },
    PRODUCT: {
        MIN_WIDTH: 300,
        MIN_HEIGHT: 300,
        MAX_WIDTH: 2000,
        MAX_HEIGHT: 2000,
        RECOMMENDED_WIDTH: 800,
        RECOMMENDED_HEIGHT: 800
    }
};

// ============================================
// URL PATTERNS
// ============================================

export const URL_PATTERNS = {
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    EMAIL: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
};

// ============================================
// PAGINATION DEFAULTS
// ============================================

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50
};

// ============================================
// RESERVED SLUGS
// ============================================

// Зарезервовані slugs (не можна використовувати)
export const RESERVED_SLUGS = [
    'admin',
    'api',
    'auth',
    'login',
    'logout',
    'register',
    'signup',
    'dashboard',
    'profile',
    'settings',
    'help',
    'support',
    'about',
    'contact',
    'terms',
    'privacy',
    'public',
    'static',
    'assets',
    'uploads',
    'images',
    'files'
];

// ============================================
// EXPORT DEFAULT
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
    BUSINESS_FILE_TYPES,
    WEBSITE_FILE_TYPES,
    PRODUCT_FILE_TYPES,
    PLAN_LIMITS,
    CURRENCIES,
    IMAGE_DIMENSIONS,
    URL_PATTERNS,
    PAGINATION,
    RESERVED_SLUGS
};