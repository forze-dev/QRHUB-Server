import mongoose from 'mongoose';
import { logInfo, logSuccess, logError } from './logger.js';
import { getDatabaseConfig } from '../config/database.js';

/**
 * Utility функція для підключення до MongoDB
 */
async function connectDB() {
    try {
        const { uri, options } = getDatabaseConfig();

        // Приховуємо пароль в логах для безпеки
        const sanitizedUri = uri.replace(/:[^:]*@/, ':****@');

        logInfo('Connecting to MongoDB...', { uri: sanitizedUri });

        const conn = await mongoose.connect(uri, options);

        logSuccess('MongoDB connected successfully', {
            host: conn.connection.host,
            database: conn.connection.name,
            port: conn.connection.port
        });

        // Обробка помилок після підключення
        mongoose.connection.on('error', (err) => {
            logError('MongoDB connection error', {
                message: err.message,
                stack: err.stack
            });
        });

        mongoose.connection.on('disconnected', () => {
            logInfo('MongoDB disconnected');
        });

        // Graceful shutdown при завершенні процесу
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logInfo('MongoDB connection closed due to app termination');
            process.exit(0);
        });

        return conn;
    } catch (error) {
        logError('MongoDB connection failed', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

export default connectDB;