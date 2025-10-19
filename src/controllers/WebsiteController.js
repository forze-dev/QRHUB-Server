/**
 * WebsiteController
 * HTTP обробка запитів для сайтів
 * 
 * Відповідальність:
 * - Приймає req, res
 * - Витягує дані з req.body, req.params, req.query, req.file
 * - Викликає WebsiteService для бізнес-логіки
 * - Формує HTTP відповідь через responseFormatter
 */

import WebsiteService from '../services/WebsiteService.js';
import { success, created, noContent } from '../utils/responseFormatter.js';
import { logInfo, logError } from '../utils/logger.js';

class WebsiteController {
    constructor() {
        // Dependency Injection
        this.websiteService = new WebsiteService();
    }

    /**
     * GET /api/websites
     * Отримати всі websites користувача
     * 
     * Query params:
     * - type: card|catalog|external
     * - status: active|inactive|draft
     * - businessId: MongoDB ObjectId
     * - page: Number (default: 1)
     * - limit: Number (default: 10)
     * - sortBy: String (default: 'createdAt')
     * - sortOrder: asc|desc (default: 'desc')
     * - populate: Boolean (default: false)
     * 
     * @access Private
     */
    getAllWebsites = async (req, res, next) => {
        try {
            const userId = req.userId; // З authMiddleware

            logInfo('Controller: Getting all websites', {
                userId,
                query: req.query
            });

            // Витягуємо параметри з query
            const options = {
                type: req.query.type,
                status: req.query.status,
                businessId: req.query.businessId,
                page: req.query.page,
                limit: req.query.limit,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                populate: req.query.populate === 'true'
            };

            // Викликаємо сервіс
            const result = await this.websiteService.getUserWebsites(
                userId,
                options
            );

            // Формуємо відповідь
            return success(res, 'Websites retrieved successfully', result);

        } catch (error) {
            logError('Controller: Failed to get websites', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * GET /api/websites/:id
     * Отримати один website по ID
     * 
     * Params:
     * - id: Website ID
     * 
     * Query params:
     * - populateProducts: Boolean (default: false)
     * 
     * @access Private
     */
    getWebsiteById = async (req, res, next) => {
        try {
            const { id } = req.params; // З validateParams
            const userId = req.userId;

            logInfo('Controller: Getting website by ID', {
                websiteId: id,
                userId
            });

            // Опціональний populate products
            const populateProducts = req.query.populateProducts === 'true';

            // Викликаємо сервіс
            const website = await this.websiteService.getWebsiteById(
                id,
                userId,
                populateProducts
            );

            // Формуємо відповідь
            return success(res, 'Website retrieved successfully', website);

        } catch (error) {
            logError('Controller: Failed to get website', {
                websiteId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * POST /api/websites
     * Створити новий website
     * 
     * Body:
     * - businessId (required)
     * - type (required): card|catalog|external
     * - metaTitle (required)
     * - slogan, description, metaDescription
     * - phone, email
     * - socialMedia: { instagram, facebook, telegram, whatsapp }
     * - externalUrl (required if type='external')
     * - analyticsEnabled
     * - status
     * 
     * File:
     * - coverImage (optional, multipart/form-data)
     * 
     * @access Private
     */
    createWebsite = async (req, res, next) => {
        try {
            const userId = req.userId;
            const websiteData = req.body; // З validateBody
            const file = req.file; // З uploadSingle('coverImage')

            logInfo('Controller: Creating website', {
                userId,
                type: websiteData.type,
                businessId: websiteData.businessId
            });

            // Викликаємо сервіс
            const website = await this.websiteService.createWebsite(
                websiteData.businessId,
                userId,
                websiteData,
                file
            );

            // Формуємо відповідь (201 Created)
            return created(res, 'Website created successfully', website);

        } catch (error) {
            logError('Controller: Failed to create website', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * PATCH /api/websites/:id
     * Оновити website
     * 
     * Params:
     * - id: Website ID
     * 
     * Body:
     * - metaTitle, slogan, description, metaDescription
     * - phone, email
     * - socialMedia
     * - externalUrl
     * - analyticsEnabled
     * - status
     * 
     * File:
     * - coverImage (optional, multipart/form-data)
     * 
     * @access Private
     */
    updateWebsite = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const updateData = req.body; // З validateBody
            const file = req.file; // З uploadSingle('coverImage')

            logInfo('Controller: Updating website', {
                websiteId: id,
                userId,
                fields: Object.keys(updateData)
            });

            // Викликаємо сервіс
            const website = await this.websiteService.updateWebsite(
                id,
                userId,
                updateData,
                file
            );

            // Формуємо відповідь
            return success(res, 'Website updated successfully', website);

        } catch (error) {
            logError('Controller: Failed to update website', {
                websiteId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * DELETE /api/websites/:id
     * Видалити website (soft delete)
     * 
     * Params:
     * - id: Website ID
     * 
     * @access Private
     */
    deleteWebsite = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Deleting website', {
                websiteId: id,
                userId
            });

            // Викликаємо сервіс
            await this.websiteService.deleteWebsite(id, userId);

            // Формуємо відповідь (204 No Content)
            return noContent(res);

        } catch (error) {
            logError('Controller: Failed to delete website', {
                websiteId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * GET /api/websites/:id/stats
     * Отримати статистику website
     * 
     * Params:
     * - id: Website ID
     * 
     * @access Private
     */
    getWebsiteStats = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Getting website stats', {
                websiteId: id,
                userId
            });

            // Викликаємо сервіс
            const stats = await this.websiteService.getWebsiteStats(id, userId);

            // Формуємо відповідь
            return success(res, 'Website stats retrieved successfully', stats);

        } catch (error) {
            logError('Controller: Failed to get website stats', {
                websiteId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    // ============================================
    // PUBLIC ENDPOINTS
    // ============================================

    /**
     * GET /api/public/websites/:slug
     * Отримати website по slug (публічний доступ)
     * 
     * Params:
     * - slug: Website slug
     * 
     * @access Public (NO authMiddleware)
     */
    getWebsiteBySlug = async (req, res, next) => {
        try {
            const { slug } = req.params; // З validateParams

            logInfo('Controller: Getting website by slug (PUBLIC)', { slug });

            // Викликаємо сервіс
            const website = await this.websiteService.getWebsiteBySlug(slug);

            // Формуємо відповідь
            return success(res, 'Website retrieved successfully', website);

        } catch (error) {
            logError('Controller: Failed to get website by slug', {
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

export default WebsiteController;