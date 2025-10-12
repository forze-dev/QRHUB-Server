/**
 * MongoDB Configuration
 * Тільки налаштування - без функцій підключення
 */

// MongoDB URI з environment variables
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qrhub';
export const MONGODB_URI_TEST = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/qrhub_test';

// Налаштування для mongoose
export const mongooseOptions = {
    // Connection pool
    maxPoolSize: 10,
    minPoolSize: 2,

    // Timeouts
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,

    // Налаштування для production
    connectTimeoutMS: 10000,
    family: 4, // Use IPv4, skip trying IPv6
};

// Налаштування для різних середовищ
export const getDatabaseConfig = () => {
    const env = process.env.NODE_ENV || 'development';

    return {
        uri: env === 'test' ? MONGODB_URI_TEST : MONGODB_URI,
        options: mongooseOptions
    };
};

export default {
    MONGODB_URI,
    MONGODB_URI_TEST,
    mongooseOptions,
    getDatabaseConfig
};