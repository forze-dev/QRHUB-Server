/**
 * QRCodeController
 * HTTP обробка запитів для QR кодів
 * 
 * Відповідальність:
 * - Приймає req, res
 * - Витягує дані з req.body, req.params, req.query
 * - Викликає QRCodeService для бізнес-логіки
 * - Формує HTTP відповідь через responseFormatter
 */

import QRCodeService from '../services/QRCodeService.js';
import { success, created, noContent } from '../utils/responseFormatter.js';
import { logInfo, logError } from '../utils/logger.js';

class QRCodeController {
    constructor() {
        // Dependency Injection
        this.qrcodeService = new QRCodeService();
    }

    // ============================================
    // CRUD ENDPOINTS
    // ============================================

    /**
     * GET /api/qrcodes
     * Отримати всі QR коди користувача
     * 
     * Query params:
     * - status: active|inactive|archived
     * - businessId: MongoDB ObjectId
     * - websiteId: MongoDB ObjectId
     * - page: Number (default: 1)
     * - limit: Number (default: 10)
     * - sortBy: String (default: 'createdAt')
     * - sortOrder: asc|desc (default: 'desc')
     * 
     * @access Private
     */
    getAllQRCodes = async (req, res, next) => {
        try {
            const userId = req.userId; // З authMiddleware

            logInfo('Controller: Getting all QR codes', {
                userId,
                query: req.query
            });

            // Витягуємо параметри з query
            const options = {
                status: req.query.status,
                businessId: req.query.businessId,
                websiteId: req.query.websiteId,
                page: req.query.page,
                limit: req.query.limit,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            };

            // Викликаємо сервіс
            const result = await this.qrcodeService.getUserQRCodes(
                userId,
                options
            );

            // Формуємо відповідь
            return success(res, 'QR коди успішно отримані', result);

        } catch (error) {
            logError('Controller: Failed to get QR codes', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * GET /api/qrcodes/:id
     * Отримати один QR код по ID
     * 
     * Params:
     * - id: QR Code ID
     * 
     * @access Private
     */
    getQRCodeById = async (req, res, next) => {
        try {
            const { id } = req.params; // З validateParams
            const userId = req.userId;

            logInfo('Controller: Getting QR code by ID', {
                qrcodeId: id,
                userId
            });

            // Викликаємо сервіс
            const qrcode = await this.qrcodeService.getQRCodeById(id, userId);

            // Формуємо відповідь
            return success(res, 'QR код успішно отриманий', qrcode);

        } catch (error) {
            logError('Controller: Failed to get QR code', {
                qrcodeId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * POST /api/qrcodes
     * Створити новий QR код
     * 
     * Body:
     * - businessId: String (required)
     * - websiteId: String (required)
     * - name: String (required)
     * - description: String (optional)
     * - targetUrl: String (required)
     * - primaryColor: String (optional) - hex color
     * - backgroundColor: String (optional) - hex color
     * 
     * @access Private
     */
    createQRCode = async (req, res, next) => {
        try {
            const userId = req.userId;
            const qrcodeData = req.body; // Вже провалідовано через validateBody

            logInfo('Controller: Creating QR code', {
                userId,
                name: qrcodeData.name
            });

            // Викликаємо сервіс
            const qrcode = await this.qrcodeService.createQRCode(
                userId,
                qrcodeData
            );

            // Формуємо відповідь (201 Created)
            return created(res, 'QR код успішно створено', qrcode);

        } catch (error) {
            logError('Controller: Failed to create QR code', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * PATCH /api/qrcodes/:id
     * Оновити QR код
     * 
     * Params:
     * - id: QR Code ID
     * 
     * Body:
     * - name: String (optional)
     * - description: String (optional)
     * - targetUrl: String (optional)
     * - primaryColor: String (optional)
     * - backgroundColor: String (optional)
     * - status: String (optional)
     * 
     * @access Private
     */
    updateQRCode = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const updateData = req.body;

            logInfo('Controller: Updating QR code', {
                qrcodeId: id,
                userId
            });

            // Викликаємо сервіс
            const qrcode = await this.qrcodeService.updateQRCode(
                id,
                userId,
                updateData
            );

            // Формуємо відповідь
            return success(res, 'QR код успішно оновлено', qrcode);

        } catch (error) {
            logError('Controller: Failed to update QR code', {
                qrcodeId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * DELETE /api/qrcodes/:id
     * Видалити QR код (soft delete)
     * 
     * Params:
     * - id: QR Code ID
     * 
     * @access Private
     */
    deleteQRCode = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Deleting QR code', {
                qrcodeId: id,
                userId
            });

            // Викликаємо сервіс
            await this.qrcodeService.deleteQRCode(id, userId);

            // Формуємо відповідь (204 No Content)
            return noContent(res);

        } catch (error) {
            logError('Controller: Failed to delete QR code', {
                qrcodeId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    // ============================================
    // СПЕЦІАЛЬНІ ENDPOINTS
    // ============================================

    /**
     * GET /api/qrcodes/:id/download
     * Завантажити QR код як файл
     * 
     * Params:
     * - id: QR Code ID
     * 
     * Query params:
     * - format: png|svg (default: png)
     * 
     * @access Private
     */
    downloadQRCode = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const format = req.query.format || 'png';

            logInfo('Controller: Downloading QR code', {
                qrcodeId: id,
                userId,
                format
            });

            // Отримуємо QR код
            const qrcode = await this.qrcodeService.getQRCodeById(id, userId);

            // Redirect на S3 URL або повертаємо URL
            if (qrcode.qrImageUrl) {
                // Можна зробити redirect
                // return res.redirect(qrcode.qrImageUrl);

                // Або повернути URL для завантаження
                return success(res, 'QR код готовий до завантаження', {
                    downloadUrl: qrcode.qrImageUrl,
                    filename: `qr-${qrcode.shortCode}.${format}`,
                    format
                });
            } else {
                throw new Error('QR image не знайдено');
            }

        } catch (error) {
            logError('Controller: Failed to download QR code', {
                qrcodeId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * POST /api/qrcodes/:id/regenerate
     * Регенерувати QR image
     * 
     * Params:
     * - id: QR Code ID
     * 
     * @access Private
     */
    regenerateQRImage = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Regenerating QR image', {
                qrcodeId: id,
                userId
            });

            // Викликаємо сервіс
            const qrcode = await this.qrcodeService.regenerateQRImage(id, userId);

            // Формуємо відповідь
            return success(res, 'QR image успішно регенеровано', qrcode);

        } catch (error) {
            logError('Controller: Failed to regenerate QR image', {
                qrcodeId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * PATCH /api/qrcodes/:id/toggle
     * Перемкнути статус QR коду (active <-> inactive)
     * 
     * Params:
     * - id: QR Code ID
     * 
     * @access Private
     */
    toggleQRCodeStatus = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Toggling QR code status', {
                qrcodeId: id,
                userId
            });

            // Отримуємо поточний QR код
            const currentQRCode = await this.qrcodeService.getQRCodeById(id, userId);

            // Перемикаємо статус
            let qrcode;
            if (currentQRCode.status === 'active') {
                qrcode = await this.qrcodeService.deactivateQRCode(id, userId);
            } else {
                qrcode = await this.qrcodeService.activateQRCode(id, userId);
            }

            // Формуємо відповідь
            return success(res, 'Статус QR коду змінено', qrcode);

        } catch (error) {
            logError('Controller: Failed to toggle QR code status', {
                qrcodeId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * PATCH /api/qrcodes/:id/activate
     * Активувати QR код
     * 
     * Params:
     * - id: QR Code ID
     * 
     * @access Private
     */
    activateQRCode = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Activating QR code', {
                qrcodeId: id,
                userId
            });

            // Викликаємо сервіс
            const qrcode = await this.qrcodeService.activateQRCode(id, userId);

            // Формуємо відповідь
            return success(res, 'QR код активовано', qrcode);

        } catch (error) {
            logError('Controller: Failed to activate QR code', {
                qrcodeId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * PATCH /api/qrcodes/:id/deactivate
     * Деактивувати QR код
     * 
     * Params:
     * - id: QR Code ID
     * 
     * @access Private
     */
    deactivateQRCode = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Deactivating QR code', {
                qrcodeId: id,
                userId
            });

            // Викликаємо сервіс
            const qrcode = await this.qrcodeService.deactivateQRCode(id, userId);

            // Формуємо відповідь
            return success(res, 'QR код деактивовано', qrcode);

        } catch (error) {
            logError('Controller: Failed to deactivate QR code', {
                qrcodeId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * GET /api/qrcodes/:id/stats
     * Отримати статистику QR коду
     * 
     * Params:
     * - id: QR Code ID
     * 
     * @access Private
     */
    getQRCodeStats = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.userId;

            logInfo('Controller: Getting QR code stats', {
                qrcodeId: id,
                userId
            });

            // Викликаємо сервіс
            const stats = await this.qrcodeService.getQRCodeStats(id, userId);

            // Формуємо відповідь
            return success(res, 'Статистика QR коду отримана', stats);

        } catch (error) {
            logError('Controller: Failed to get QR code stats', {
                qrcodeId: req.params.id,
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    // ============================================
    // BULK OPERATIONS (для майбутнього)
    // ============================================

    /**
     * POST /api/qrcodes/bulk-create
     * Створити кілька QR кодів одночасно
     * 
     * Body:
     * - qrcodes: Array of QR code data
     * 
     * @access Private
     */
    bulkCreateQRCodes = async (req, res, next) => {
        try {
            const userId = req.userId;
            const { qrcodes } = req.body;

            logInfo('Controller: Bulk creating QR codes', {
                userId,
                count: qrcodes?.length
            });

            // TODO: Implement bulk create in service
            // const results = await this.qrcodeService.bulkCreateQRCodes(userId, qrcodes);

            return success(res, 'Bulk create не реалізовано (для майбутнього)', {
                message: 'Ця функція буде доступна в наступних версіях'
            });

        } catch (error) {
            logError('Controller: Failed to bulk create QR codes', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };

    /**
     * DELETE /api/qrcodes/bulk-delete
     * Видалити кілька QR кодів одночасно
     * 
     * Body:
     * - ids: Array of QR code IDs
     * 
     * @access Private
     */
    bulkDeleteQRCodes = async (req, res, next) => {
        try {
            const userId = req.userId;
            const { ids } = req.body;

            logInfo('Controller: Bulk deleting QR codes', {
                userId,
                count: ids?.length
            });

            // TODO: Implement bulk delete in service
            // await this.qrcodeService.bulkDeleteQRCodes(userId, ids);

            return success(res, 'Bulk delete не реалізовано (для майбутнього)', {
                message: 'Ця функція буде доступна в наступних версіях'
            });

        } catch (error) {
            logError('Controller: Failed to bulk delete QR codes', {
                userId: req.userId,
                error: error.message
            });
            next(error);
        }
    };
}

// ============================================
// EXPORT
// ============================================

export default QRCodeController;