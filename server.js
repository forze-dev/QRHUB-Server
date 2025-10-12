import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/utils/connectDB.js';
import { logInfo, logError, logSuccess, logWarn } from './src/utils/logger.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Функція запуску сервера
async function startServer() {
    try {
        // Підключення до MongoDB
        await connectDB();

        // Запуск сервера
        const server = app.listen(PORT, () => {
            logSuccess(`Server running on port ${PORT}`, {
                port: PORT,
                environment: NODE_ENV
            });
        });

        // Обробка помилок на рівні процесу
        process.on('unhandledRejection', (err) => {
            logError('Unhandled Rejection detected', {
                message: err.message,
                stack: err.stack
            });

            // Закриваємо сервер gracefully
            server.close(() => {
                process.exit(1);
            });
        });

        process.on('uncaughtException', (err) => {
            logError('Uncaught Exception detected', {
                message: err.message,
                stack: err.stack
            });
            process.exit(1);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logWarn('SIGTERM received, shutting down gracefully...');
            server.close(() => {
                logInfo('Process terminated');
            });
        });

        process.on('SIGINT', () => {
            logWarn('SIGINT received, shutting down gracefully...');
            server.close(() => {
                logInfo('Process terminated');
            });
        });

        return server;
    } catch (error) {
        logError('Failed to start server', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

// Запускаємо сервер
startServer();

export default startServer;