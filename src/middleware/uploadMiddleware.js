/**
 * Upload Middleware
 * Multer конфігурація для завантаження файлів
 * 
 * Використовує memory storage (файли зберігаються в buffer)
 * Файли потім завантажуються в Hetzner S3 через S3Service
 */

import multer from 'multer';
import { BUSINESS_FILE_TYPES } from '../config/constants.js';
import { logWarn, logError } from '../utils/logger.js';
import { BadRequestError } from '../utils/errorHandler.js';

// ============================================
// MULTER STORAGE
// ============================================

/**
 * Використовуємо memory storage
 * Файли зберігаються в req.file.buffer
 * Потім завантажуються в S3 через S3Service
 */
const storage = multer.memoryStorage();

// ============================================
// FILE FILTER
// ============================================

/**
 * Фільтр для перевірки типу файлу
 * Дозволяє тільки зображення
 */
const fileFilter = (req, file, cb) => {
    // Перевіряємо MIME type
    const allowedTypes = BUSINESS_FILE_TYPES.LOGO.ALLOWED_TYPES;

    if (allowedTypes.includes(file.mimetype)) {
        // Файл валідний
        cb(null, true);
    } else {
        // Файл невалідний
        logWarn('Invalid file type uploaded', {
            mimetype: file.mimetype,
            originalname: file.originalname,
            allowedTypes
        });

        cb(
            new BadRequestError(
                `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
            ),
            false
        );
    }
};

// ============================================
// MULTER CONFIGURATION
// ============================================

/**
 * Базова конфігурація Multer
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: BUSINESS_FILE_TYPES.LOGO.MAX_SIZE, // 5MB
        files: 1 // Максимум 1 файл для single upload
    }
});

// ============================================
// UPLOAD MIDDLEWARE FUNCTIONS
// ============================================

/**
 * Middleware для завантаження одного файлу
 * 
 * @param {String} fieldName - Назва поля в form-data
 * @returns {Function} - Express middleware
 * 
 * @example
 * router.post('/business', uploadSingle('logo'), controller.create);
 */
export const uploadSingle = (fieldName) => {
    return (req, res, next) => {
        const uploadMiddleware = upload.single(fieldName);

        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Помилка Multer (розмір файлу, кількість файлів, тощо)
                logError('Multer error', {
                    error: err.message,
                    code: err.code,
                    field: err.field
                });

                if (err.code === 'LIMIT_FILE_SIZE') {
                    const maxSizeMB = (BUSINESS_FILE_TYPES.LOGO.MAX_SIZE / (1024 * 1024)).toFixed(2);
                    return next(
                        new BadRequestError(
                            `File size too large. Maximum size: ${maxSizeMB}MB`
                        )
                    );
                }

                if (err.code === 'LIMIT_FILE_COUNT') {
                    return next(
                        new BadRequestError('Too many files. Maximum 1 file allowed')
                    );
                }

                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return next(
                        new BadRequestError(`Unexpected field: ${err.field}`)
                    );
                }

                return next(new BadRequestError(`Upload error: ${err.message}`));
            } else if (err) {
                // Інша помилка (наприклад, від fileFilter)
                return next(err);
            }

            // Все ОК, продовжуємо
            next();
        });
    };
};

/**
 * Middleware для завантаження декількох файлів
 * 
 * @param {String} fieldName - Назва поля в form-data
 * @param {Number} maxCount - Максимальна кількість файлів
 * @returns {Function} - Express middleware
 * 
 * @example
 * router.post('/products', uploadMultiple('images', 5), controller.create);
 */
export const uploadMultiple = (fieldName, maxCount = 5) => {
    return (req, res, next) => {
        const uploadMiddleware = upload.array(fieldName, maxCount);

        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                logError('Multer error (multiple)', {
                    error: err.message,
                    code: err.code,
                    field: err.field
                });

                if (err.code === 'LIMIT_FILE_SIZE') {
                    const maxSizeMB = (BUSINESS_FILE_TYPES.LOGO.MAX_SIZE / (1024 * 1024)).toFixed(2);
                    return next(
                        new BadRequestError(
                            `File size too large. Maximum size: ${maxSizeMB}MB per file`
                        )
                    );
                }

                if (err.code === 'LIMIT_FILE_COUNT') {
                    return next(
                        new BadRequestError(
                            `Too many files. Maximum ${maxCount} files allowed`
                        )
                    );
                }

                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return next(
                        new BadRequestError(`Unexpected field: ${err.field}`)
                    );
                }

                return next(new BadRequestError(`Upload error: ${err.message}`));
            } else if (err) {
                return next(err);
            }

            next();
        });
    };
};

/**
 * Middleware для завантаження декількох полів з файлами
 * 
 * @param {Array} fields - Масив об'єктів {name, maxCount}
 * @returns {Function} - Express middleware
 * 
 * @example
 * router.post('/website', uploadFields([
 *   { name: 'logo', maxCount: 1 },
 *   { name: 'cover', maxCount: 1 }
 * ]), controller.create);
 */
export const uploadFields = (fields) => {
    return (req, res, next) => {
        const uploadMiddleware = upload.fields(fields);

        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                logError('Multer error (fields)', {
                    error: err.message,
                    code: err.code,
                    field: err.field
                });

                if (err.code === 'LIMIT_FILE_SIZE') {
                    const maxSizeMB = (BUSINESS_FILE_TYPES.LOGO.MAX_SIZE / (1024 * 1024)).toFixed(2);
                    return next(
                        new BadRequestError(
                            `File size too large. Maximum size: ${maxSizeMB}MB per file`
                        )
                    );
                }

                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return next(
                        new BadRequestError(`Unexpected field: ${err.field}`)
                    );
                }

                return next(new BadRequestError(`Upload error: ${err.message}`));
            } else if (err) {
                return next(err);
            }

            next();
        });
    };
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    uploadSingle,
    uploadMultiple,
    uploadFields
};