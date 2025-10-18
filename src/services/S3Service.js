/**
 * S3Service - Hetzner Object Storage Service
 * Infrastructure service для роботи з Hetzner S3-compatible Object Storage
 * 
 * Використовує AWS SDK v3 (@aws-sdk/client-s3)
 * Документація: https://docs.hetzner.com/storage/object-storage/
 */

import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    HeadObjectCommand
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { logInfo, logSuccess, logError, logWarn } from '../utils/logger.js';
import { BUSINESS_FILE_TYPES } from '../config/constants.js';

class S3Service {
    constructor() {
        // Валідація environment variables
        this.validateConfig();

        // Конфігурація для Hetzner Object Storage
        this.region = process.env.HETZNER_S3_REGION || 'fsn1';
        this.bucket = process.env.HETZNER_S3_BUCKET;
        this.endpoint = process.env.HETZNER_S3_ENDPOINT;
        this.cdnUrl = process.env.HETZNER_CDN_URL; // Опціонально для CDN

        // Ініціалізація S3 Client
        this.s3Client = new S3Client({
            region: this.region,
            endpoint: this.endpoint,
            credentials: {
                accessKeyId: process.env.HETZNER_S3_ACCESS_KEY,
                secretAccessKey: process.env.HETZNER_S3_SECRET_KEY
            },
            forcePathStyle: false, // Використовуємо virtual-hosted-style URLs
            apiVersion: 'latest'
        });

        logSuccess('S3Service initialized', {
            region: this.region,
            bucket: this.bucket,
            endpoint: this.endpoint
        });
    }

    /**
     * Валідація конфігурації
     */
    validateConfig() {
        const required = [
            'HETZNER_S3_ENDPOINT',
            'HETZNER_S3_ACCESS_KEY',
            'HETZNER_S3_SECRET_KEY',
            'HETZNER_S3_BUCKET'
        ];

        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            const error = `Missing required S3 environment variables: ${missing.join(', ')}`;
            logError('S3Service configuration error', { missing });
            throw new Error(error);
        }
    }

    /**
     * Завантажити файл в Hetzner Object Storage
     * 
     * @param {Object} file - Об'єкт файлу (від Multer)
     * @param {String} folder - Папка в bucket (logos, covers, products, qrcodes)
     * @param {Object} options - Додаткові опції
     * @returns {Promise<String>} - Публічний URL завантаженого файлу
     * 
     * @example
     * const url = await s3Service.uploadFile(req.file, 'logos');
     * // => "https://qrhub-storage.fsn1.your-objectstorage.com/logos/uuid-logo.jpg"
     */
    async uploadFile(file, folder, options = {}) {
        try {
            logInfo('Uploading file to S3', {
                originalName: file.originalname,
                folder,
                size: file.size,
                mimetype: file.mimetype
            });

            // Валідація файлу
            this.validateFile(file, folder);

            // Генерація унікального імені файлу
            const fileName = this.generateFileName(file.originalname);
            const originalName = this.sanitizeFileName(file.originalname)
            const key = `${folder}/${fileName}`;

            // Підготовка параметрів для завантаження
            const uploadParams = {
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer, // Multer memory storage
                ContentType: file.mimetype,
                ACL: options.acl || 'public-read', // Публічний доступ за замовчуванням
                CacheControl: options.cacheControl || 'public, max-age=31536000', // 1 рік
                Metadata: {
                    originalName,
                    uploadedAt: new Date().toISOString(),
                    ...options.metadata
                }
            };

            // Завантаження файлу
            const command = new PutObjectCommand(uploadParams);
            await this.s3Client.send(command);

            // Генерація публічного URL
            const publicUrl = this.getPublicUrl(key);

            logSuccess('File uploaded successfully', {
                fileName,
                folder,
                size: file.size,
                url: publicUrl
            });

            return publicUrl;

        } catch (error) {
            logError('Failed to upload file to S3', {
                originalName: file?.originalname,
                folder,
                error: error.message,
                stack: error.stack
            });
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Завантажити декілька файлів
     * 
     * @param {Array} files - Масив файлів (від Multer)
     * @param {String} folder - Папка в bucket
     * @param {Object} options - Додаткові опції
     * @returns {Promise<Array<String>>} - Масив публічних URL
     */
    async uploadMultiple(files, folder, options = {}) {
        try {
            logInfo('Uploading multiple files to S3', {
                count: files.length,
                folder
            });

            // Завантажуємо всі файли паралельно
            const uploadPromises = files.map(file =>
                this.uploadFile(file, folder, options)
            );

            const urls = await Promise.all(uploadPromises);

            logSuccess('Multiple files uploaded successfully', {
                count: urls.length,
                folder
            });

            return urls;

        } catch (error) {
            logError('Failed to upload multiple files', {
                folder,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Видалити файл з Hetzner Object Storage
     * 
     * @param {String} fileUrl - Повний URL файлу або key
     * @returns {Promise<Boolean>} - true якщо успішно видалено
     * 
     * @example
     * await s3Service.deleteFile('https://bucket.fsn1.../logos/uuid-logo.jpg');
     * await s3Service.deleteFile('logos/uuid-logo.jpg'); // або тільки key
     */
    async deleteFile(fileUrl) {
        try {
            if (!fileUrl) {
                logWarn('Attempted to delete file with empty URL');
                return false;
            }

            // Витягуємо key з URL
            const key = this.extractKeyFromUrl(fileUrl);

            if (!key) {
                logWarn('Could not extract key from URL', { fileUrl });
                return false;
            }

            logInfo('Deleting file from S3', { key });

            // Видалення файлу
            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key
            });

            await this.s3Client.send(command);

            logSuccess('File deleted successfully', { key });

            return true;

        } catch (error) {
            // Якщо файл не існує - не вважаємо це помилкою
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                logWarn('File not found, skipping deletion', { fileUrl });
                return true;
            }

            logError('Failed to delete file from S3', {
                fileUrl,
                error: error.message
            });
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Видалити декілька файлів
     * 
     * @param {Array<String>} fileUrls - Масив URL файлів
     * @returns {Promise<Boolean>} - true якщо всі файли видалено
     */
    async deleteMultiple(fileUrls) {
        try {
            if (!fileUrls || fileUrls.length === 0) {
                return true;
            }

            logInfo('Deleting multiple files from S3', {
                count: fileUrls.length
            });

            // Витягуємо keys з URLs
            const keys = fileUrls
                .map(url => this.extractKeyFromUrl(url))
                .filter(key => key !== null);

            if (keys.length === 0) {
                return true;
            }

            // Використовуємо batch delete для оптимізації
            const command = new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: {
                    Objects: keys.map(key => ({ Key: key })),
                    Quiet: true // Не повертати список видалених об'єктів
                }
            });

            await this.s3Client.send(command);

            logSuccess('Multiple files deleted successfully', {
                count: keys.length
            });

            return true;

        } catch (error) {
            logError('Failed to delete multiple files', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Перевірити чи існує файл
     * 
     * @param {String} fileUrl - URL файлу або key
     * @returns {Promise<Boolean>} - true якщо файл існує
     */
    async fileExists(fileUrl) {
        try {
            const key = this.extractKeyFromUrl(fileUrl);

            if (!key) {
                return false;
            }

            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key
            });

            await this.s3Client.send(command);
            return true;

        } catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Очищає ім'я файлу, видаляючи недопустимі символи (не-ASCII, пробіли, спецсимволи).
     * Використовується для безпечного збереження у метаданих S3.
     * 
     * @param {string} name - Оригінальне ім'я файлу
     * @returns {string} Безпечне ASCII-ім'я файлу
     */
    sanitizeFileName(name) {
        return Buffer.from(name, 'utf8')
            .toString('ascii')
            .replace(/[^\x20-\x7E]/g, '')     // Видаляє не-ASCII символи
            .replace(/[^a-zA-Z0-9._-]/g, '_') // Замінює пробіли і спецсимволи на "_"
            .trim();
    }


    /**
     * Генерує унікальне ім'я файлу
     * 
     * @param {String} originalName - Оригінальне ім'я файлу
     * @returns {String} - Унікальне ім'я файлу
     * 
     * @example
     * generateFileName('logo.jpg')
     * // => '550e8400-e29b-41d4-a716-446655440000-logo.jpg'
     */
    generateFileName(originalName) {
        const uuid = uuidv4();
        const ext = path.extname(originalName).toLowerCase();
        const nameWithoutExt = path.basename(originalName, ext)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-') // Замінюємо спецсимволи на дефіси
            .replace(/-+/g, '-') // Множинні дефіси на один
            .substring(0, 50); // Обмежуємо довжину

        return `${uuid}-${nameWithoutExt}${ext}`;
    }

    /**
     * Отримує публічний URL файлу
     * 
     * @param {String} key - Key файлу в bucket (folder/filename)
     * @returns {String} - Публічний URL
     * 
     * @example
     * getPublicUrl('logos/uuid-logo.jpg')
     * // => "https://qrhub-storage.fsn1.your-objectstorage.com/logos/uuid-logo.jpg"
     */
    getPublicUrl(key) {
        // Якщо є CDN URL - використовуємо його
        if (this.cdnUrl) {
            return `${this.cdnUrl}/${key}`;
        }

        // Hetzner Object Storage public URL format:
        // https://<bucket-name>.<region>.your-objectstorage.com/<key>
        return `https://${this.bucket}.${this.region}.your-objectstorage.com/${key}`;
    }

    /**
     * Витягує key з повного URL
     * 
     * @param {String} fileUrl - Повний URL або key
     * @returns {String|null} - Key файлу або null
     * 
     * @example
     * extractKeyFromUrl('https://bucket.fsn1.../logos/uuid-logo.jpg')
     * // => 'logos/uuid-logo.jpg'
     */
    extractKeyFromUrl(fileUrl) {
        if (!fileUrl || typeof fileUrl !== 'string') {
            return null;
        }

        // Якщо це вже key (не URL)
        if (!fileUrl.startsWith('http')) {
            return fileUrl;
        }

        try {
            const url = new URL(fileUrl);
            // Видаляємо перший слеш з pathname
            return url.pathname.substring(1);
        } catch (error) {
            logWarn('Failed to parse URL', { fileUrl });
            return null;
        }
    }

    /**
     * Валідує файл перед завантаженням
     * 
     * @param {Object} file - Файл від Multer
     * @param {String} folder - Тип файлу (logos, covers, products)
     * @throws {Error} - Якщо файл не валідний
     */
    validateFile(file, folder) {
        if (!file || !file.buffer) {
            throw new Error('Invalid file object');
        }

        // Отримуємо правила валідації залежно від типу
        let allowedTypes;
        let maxSize;

        switch (folder) {
            case 'logos':
                allowedTypes = BUSINESS_FILE_TYPES.LOGO.ALLOWED_TYPES;
                maxSize = BUSINESS_FILE_TYPES.LOGO.MAX_SIZE;
                break;
            // Можна додати інші типи файлів
            default:
                allowedTypes = BUSINESS_FILE_TYPES.LOGO.ALLOWED_TYPES;
                maxSize = BUSINESS_FILE_TYPES.LOGO.MAX_SIZE;
        }

        // Перевірка типу файлу
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(
                `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
            );
        }

        // Перевірка розміру файлу
        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
            throw new Error(
                `File size too large. Maximum size: ${maxSizeMB}MB`
            );
        }

        // Перевірка що файл має дані
        if (file.size === 0) {
            throw new Error('File is empty');
        }
    }

    /**
     * Отримує інформацію про файл
     * 
     * @param {String} fileUrl - URL файлу
     * @returns {Promise<Object>} - Метадані файлу
     */
    async getFileMetadata(fileUrl) {
        try {
            const key = this.extractKeyFromUrl(fileUrl);

            if (!key) {
                throw new Error('Invalid file URL');
            }

            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key
            });

            const response = await this.s3Client.send(command);

            return {
                size: response.ContentLength,
                contentType: response.ContentType,
                lastModified: response.LastModified,
                metadata: response.Metadata,
                etag: response.ETag
            };

        } catch (error) {
            logError('Failed to get file metadata', {
                fileUrl,
                error: error.message
            });
            throw error;
        }
    }
}

// ============================================
// EXPORT
// ============================================

export default S3Service;