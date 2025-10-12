import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Кастомні рівні для winston (додаємо SUCCESS)
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        success: 2,
        info: 3,
        debug: 4
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        success: 'green',
        info: 'blue',
        debug: 'magenta'
    }
};

// Налаштування winston для запису у файли
const fileTransport = new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/%DATE%.log'),
    datePattern: 'YYYY_MM_DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
    )
});

const winstonLogger = winston.createLogger({
    levels: customLevels.levels,  // Використовуємо кастомні рівні
    transports: [fileTransport],
    exitOnError: false
});

// Додаємо кольори
winston.addColors(customLevels.colors);

// Кружечки та статуси
const statusConfig = {
    INFO: {
        emoji: '🔵',
        label: 'INFO'
    },
    SUCCESS: {
        emoji: '🟢',
        label: 'SUCCESS'
    },
    WARN: {
        emoji: '🟡',
        label: 'WARN'
    },
    ERROR: {
        emoji: '🔴',
        label: 'ERROR'
    },
    DEBUG: {
        emoji: '🟣',
        label: 'DEBUG'
    }
};

/**
 * Отримує ім'я файлу та функції/методу звідки викликано logger
 */
function getCallerInfo() {
    const stack = new Error().stack;
    const stackLines = stack.split('\n');

    // Шукаємо правильний рядок:
    // 0: Error
    // 1: getCallerInfo
    // 2: logger
    // 3: logInfo/logSuccess/etc (helper)
    // 4: реальний викликувач ← НАМ ПОТРІБЕН ЦЕЙ!

    let targetLine = stackLines[4]; // Для helpers (logInfo, logSuccess)

    // Якщо викликається logger() напряму - беремо 3-й рядок
    if (stackLines[3] && !stackLines[3].includes('logInfo') &&
        !stackLines[3].includes('logSuccess') &&
        !stackLines[3].includes('logError') &&
        !stackLines[3].includes('logWarn') &&
        !stackLines[3].includes('logDebug')) {
        targetLine = stackLines[3];
    }

    if (targetLine) {
        // Витягуємо ім'я функції
        const funcMatch = targetLine.match(/at\s+(\S+)\s+/);
        const funcName = funcMatch && funcMatch[1]
            ? funcMatch[1].replace('Object.', '').replace('async ', '')
            : 'Anonymous';

        // Витягуємо ім'я файлу
        const fileMatch = targetLine.match(/\/([\w-]+\.js)/);
        const fileName = fileMatch && fileMatch[1] ? fileMatch[1] : 'unknown.js';

        return `${fileName} / ${funcName}`;
    }

    return 'unknown.js / Unknown';
}

/**
 * Форматує об'єкт для красивого виводу
 */
function formatData(data) {
    if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data, null, 2);
    }
    return data;
}

/**
 * Основна функція логування
 * @param {string} message - Повідомлення для логування
 * @param {string} status - Статус: INFO, SUCCESS, WARN, ERROR, DEBUG
 * @param {any} data - Додаткові дані (об'єкт, масив, тощо)
 */
function logger(message, status = 'INFO', data = null) {
    const config = statusConfig[status] || statusConfig.INFO;
    const caller = getCallerInfo();
    const timestamp = new Date().toISOString();

    // Формуємо вивід для консолі
    const consoleOutput = `${config.emoji} [${caller}] ${config.label} - ${message}`;

    console.log(consoleOutput);

    // Якщо є додаткові дані - виводимо їх красиво
    if (data !== null) {
        console.log(formatData(data));
    }

    // Асинхронно записуємо у файл (не блокує код)
    const logData = {
        timestamp,
        caller,
        status: config.label,
        message,
        ...(data && { data })
    };

    winstonLogger.log({
        level: status.toLowerCase(),
        ...logData
    });
}

// Експортуємо головну функцію та helper-функції
export default logger;

// Helper функції для зручності з префіксом log
export const logInfo = (message, data) => logger(message, 'INFO', data);
export const logSuccess = (message, data) => logger(message, 'SUCCESS', data);
export const logWarn = (message, data) => logger(message, 'WARN', data);
export const logError = (message, data) => logger(message, 'ERROR', data);
export const logDebug = (message, data) => logger(message, 'DEBUG', data);