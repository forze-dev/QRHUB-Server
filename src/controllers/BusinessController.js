/**
 * BusinessController
 * HTTP обробка запитів для бізнесів
 * 
 * Відповідальність:
 * - Приймає req, res
 * - Витягує дані з req.body, req.params, req.query, req.files
 * - Викликає BusinessService для бізнес-логіки
 * - Формує HTTP відповідь через responseFormatter
 * 
 * НЕ робить:
 * - Бізнес-логіку
 * - Прямі запити до БД
 * - Складні обчислення
 */

import BusinessService from '../services/BusinessService.js';
import { success, created, noContent } from '../utils/responseFormatter.js';
import { logInfo, logError } from '../utils/logger.js';

class BusinessController {
    constructor() {
        // Dependency Injection
        this.businessService = new BusinessService();
    }

    /**
     * GET /api/businesses
     * Отримати всі бізнеси користувача
     * 
     * Query params:
     * - status: active|inactive|pending_payment
     * - page: Number (default: 1)
     * - limit: Number (default: 10)
     * - sortBy: String (default: 'createdAt')
     * - sortOrder: asc|desc (default: 'desc')
     * 
     * @access Private
     */
    getAllBusinesses = async (req, res, next) => {
        try {
            const userId = req.userId; // З authMiddleware

            logInfo('Controller: Getting all businesses', {
                userId,
                query: req.query
            });

            // Витягуємо параметри з query
            const options = {
                status: req.query.status,
                page: req.query.page,
                limit: req.query.limit,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            };

            // Викликаємо сервіс
            const result = await this.businessService.getUserBusinesses(
                userId,
                options
            );

            // Формуємо відповідь
            return success(res, 'Businesses retrieved successfully', result);

        } catch (error) {
            logError('Controller: Failed to get businesses', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * GET /api/businesses/:id
     * Отримати один бізнес по ID
     * 
     * Params:
     * - id: Business ID
     * 
     * Query params:
     * - populate: Boolean (populate websites and qrcodes)
     * 
     * @access Private
     */
    getBusinessById = async (req, res, next) => {
        try {
            const { id } = req.params; // З validateParams
            const userId = req.userId;

            logInfo('Controller: Getting business by ID', {
                businessId: id,
                userId
            });

            // Опціональний populate
            const options = {
                populate: req.query.populate === 'true'
            };

            // Викликаємо сервіс
            const business = await this.businessService.getBusinessById(
                id,
                userId,
                options
            );

            // Формуємо відповідь
            return success(res, 'Business retrieved successfully', { business });

        } catch (error) {
            logError('Controller: Failed to get business', {
                businessId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * POST /api/businesses
     * Створити новий бізнес
     * 
     * Body (multipart/form-data):
     * - name: String (required)
     * - description: String (optional)
     * - phone: String (optional)
     * - email: String (optional)
     * - address: Object (optional)
     * - socialMedia: Object (optional)
     * - logo: File (optional, від uploadSingle middleware)
     * 
     * @access Private
     */
    createBusiness = async (req, res, next) => {
        try {
            const userId = req.userId;
            const businessData = req.body; // Валідовані дані з validateBody
            const files = {
                logo: req.file ? [req.file] : null // Від uploadSingle('logo')
            };

            logInfo('Controller: Creating business', {
                userId,
                name: businessData.name,
                hasLogo: !!req.file
            });

            // Викликаємо сервіс
            const business = await this.businessService.createBusiness(
                userId,
                businessData,
                files
            );

            // Формуємо відповідь 201 Created
            return created(
                res,
                'Business created successfully',
                { business }
            );

        } catch (error) {
            logError('Controller: Failed to create business', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * PATCH /api/businesses/:id
     * Оновити бізнес
     * 
     * Params:
     * - id: Business ID
     * 
     * Body (multipart/form-data):
     * - name: String (optional)
     * - description: String (optional)
     * - phone: String (optional)
     * - email: String (optional)
     * - address: Object (optional)
     * - socialMedia: Object (optional)
     * - status: String (optional)
     * - logo: File (optional, від uploadSingle middleware)
     * 
     * @access Private
     */
    updateBusiness = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const updateData = req.body; // Валідовані дані
            const files = {
                logo: req.file ? [req.file] : null
            };

            logInfo('Controller: Updating business', {
                businessId: id,
                userId,
                hasNewLogo: !!req.file,
                fields: Object.keys(updateData)
            });

            // Викликаємо сервіс
            const business = await this.businessService.updateBusiness(
                id,
                userId,
                updateData,
                files
            );

            // Формуємо відповідь
            return success(res, 'Business updated successfully', { business });

        } catch (error) {
            logError('Controller: Failed to update business', {
                businessId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * DELETE /api/businesses/:id
     * Видалити бізнес (soft delete)
     * 
     * Params:
     * - id: Business ID
     * 
     * @access Private
     */
    deleteBusiness = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Deleting business', {
                businessId: id,
                userId
            });

            // Викликаємо сервіс
            await this.businessService.deleteBusiness(id, userId);

            // Формуємо відповідь 200 (не 204, бо повертаємо message)
            return success(res, 'Business deleted successfully');

        } catch (error) {
            logError('Controller: Failed to delete business', {
                businessId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * GET /api/businesses/:id/stats
     * Отримати статистику бізнесу
     * 
     * Params:
     * - id: Business ID
     * 
     * @access Private
     */
    getBusinessStats = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Getting business stats', {
                businessId: id,
                userId
            });

            // Викликаємо сервіс
            const stats = await this.businessService.getBusinessStats(
                id,
                userId
            );

            // Формуємо відповідь
            return success(res, 'Business stats retrieved successfully', { stats });

        } catch (error) {
            logError('Controller: Failed to get business stats', {
                businessId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * GET /api/businesses/slug/:slug (BONUS - публічний доступ)
     * Отримати бізнес по slug для публічного перегляду
     * 
     * Params:
     * - slug: Business slug
     * 
     * @access Public
     */
    getBusinessBySlug = async (req, res, next) => {
        try {
            const { slug } = req.params;

            logInfo('Controller: Getting business by slug', { slug });

            // Викликаємо сервіс
            const business = await this.businessService.getBusinessBySlug(slug);

            // Формуємо відповідь
            return success(res, 'Business retrieved successfully', { business });

        } catch (error) {
            logError('Controller: Failed to get business by slug', {
                slug: req.params.slug,
                error: error.message
            });
            next(error);
        }
    };
}

// ============================================
// EXPORT
// ============================================

export default BusinessController;