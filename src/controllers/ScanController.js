/**
 * ScanController
 * HTTP обробка для публічних QR сканувань
 * 
 * Відповідальність:
 * - Приймає req, res
 * - Витягує shortCode з req.params
 * - Викликає ScanService для обробки
 * - Робить redirect на targetUrl
 * 
 * ВАЖЛИВО: Це PUBLIC endpoint без authMiddleware!
 */

import ScanService from '../services/ScanService.js';
import { logInfo, logError, logWarn } from '../utils/logger.js';

class ScanController {
    constructor() {
        // Dependency Injection
        this.scanService = new ScanService();
    }

    // ============================================
    // SCAN AND REDIRECT
    // ============================================

    /**
     * GET /s/:shortCode
     * Публічний endpoint для сканування QR та redirect
     * 
     * Params:
     * - shortCode: Короткий код QR (abc123)
     * 
     * @access Public (без authMiddleware!)
     */
    scanAndRedirect = async (req, res, next) => {
        try {
            const { shortCode } = req.params;

            logInfo('QR scan request received', {
                shortCode,
                ip: req.ip,
                userAgent: req.headers['user-agent']?.substring(0, 50) // Обрізаємо для логів
            });

            // Валідація shortCode
            if (!shortCode) {
                logWarn('Missing shortCode in scan request');
                return this.renderErrorPage(res, 'QR код не знайдено');
            }

            // Витягуємо дані з request
            const scanData = this.scanService.extractScanDataFromRequest(req);

            // Rate limiting перевірка (опціонально)
            const isAllowed = await this.scanService.isRateLimitAllowed(
                scanData.ip,
                shortCode
            );

            if (!isAllowed) {
                logWarn('Rate limit exceeded for scan', {
                    shortCode,
                    ip: scanData.ip
                });
                return this.renderErrorPage(res, 'Занадто багато запитів. Спробуйте пізніше.');
            }

            // Обробка скану через Service
            const result = await this.scanService.processScan(shortCode, scanData);

            logInfo('QR scan processed, redirecting', {
                shortCode,
                targetUrl: result.targetUrl,
                isUnique: result.scan.isUnique
            });

            // Redirect 302 (Temporary) на targetUrl
            return res.redirect(302, result.targetUrl);

        } catch (error) {
            logError('Failed to process QR scan', {
                shortCode: req.params.shortCode,
                error: error.message
            });

            // Не викидаємо next(error), щоб не показувати технічні деталі
            // Замість цього показуємо user-friendly повідомлення
            return this.renderErrorPage(res, 'QR код не знайдено або неактивний');
        }
    };

    // ============================================
    // SCAN WITH ANALYTICS PAGE (для майбутнього)
    // ============================================

    /**
     * GET /s/:shortCode/preview
     * Показує проміжну сторінку з аналітикою перед redirect
     * Корисно для тестування або преміум функцій
     * 
     * @access Public
     */
    scanWithPreview = async (req, res, next) => {
        try {
            const { shortCode } = req.params;

            logInfo('QR scan preview request', { shortCode });

            // Витягуємо дані
            const scanData = this.scanService.extractScanDataFromRequest(req);

            // Обробка скану
            const result = await this.scanService.processScan(shortCode, scanData);

            // Повертаємо JSON з інформацією (для SPA frontend)
            return res.status(200).json({
                success: true,
                message: 'QR код відскановано',
                data: {
                    qrCode: result.qrCode,
                    targetUrl: result.targetUrl,
                    scan: result.scan,
                    redirectIn: 3 // секунд
                }
            });

        } catch (error) {
            logError('Failed to show scan preview', {
                shortCode: req.params.shortCode,
                error: error.message
            });

            return res.status(404).json({
                success: false,
                message: 'QR код не знайдено або неактивний'
            });
        }
    };

    // ============================================
    // ERROR PAGE RENDERING
    // ============================================

    /**
     * Рендерить простий HTML з повідомленням про помилку
     * 
     * @param {Object} res - Express response
     * @param {String} message - Повідомлення для користувача
     */
    renderErrorPage(res, message) {
        const html = `
            <!DOCTYPE html>
            <html lang="uk">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QR код не знайдено - QRHub</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        padding: 48px;
                        max-width: 500px;
                        width: 100%;
                        text-align: center;
                    }
                    .icon {
                        width: 80px;
                        height: 80px;
                        background: #FEE2E2;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 24px;
                        font-size: 40px;
                    }
                    h1 {
                        color: #1F2937;
                        font-size: 24px;
                        margin-bottom: 12px;
                        font-weight: 600;
                    }
                    p {
                        color: #6B7280;
                        font-size: 16px;
                        line-height: 1.5;
                        margin-bottom: 32px;
                    }
                    .button {
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 14px 32px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 500;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
                    }
                    .footer {
                        margin-top: 32px;
                        color: #9CA3AF;
                        font-size: 14px;
                    }
                    @media (max-width: 600px) {
                        .container {
                            padding: 32px 24px;
                        }
                        h1 {
                            font-size: 20px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">❌</div>
                    <h1>Упс! Щось пішло не так</h1>
                    <p>${message}</p>
                    <a href="https://qrhub.online" class="button">Повернутися на головну</a>
                    <div class="footer">
                        QRHub.online - QR коди для вашого бізнесу
                    </div>
                </div>
            </body>
            </html>
        `;

        return res.status(404).send(html);
    }

    // ============================================
    // SUCCESS PAGE (опціонально)
    // ============================================

    /**
     * Рендерить сторінку успішного скану
     * Використовується якщо потрібна проміжна сторінка
     */
    renderSuccessPage(res, qrCode, targetUrl) {
        const html = `
            <!DOCTYPE html>
            <html lang="uk">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="refresh" content="3;url=${targetUrl}">
                <title>Перенаправлення - QRHub</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        padding: 48px;
                        max-width: 500px;
                        width: 100%;
                        text-align: center;
                    }
                    .icon {
                        width: 80px;
                        height: 80px;
                        background: #D1FAE5;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 24px;
                        font-size: 40px;
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    h1 {
                        color: #1F2937;
                        font-size: 24px;
                        margin-bottom: 12px;
                        font-weight: 600;
                    }
                    p {
                        color: #6B7280;
                        font-size: 16px;
                        line-height: 1.5;
                        margin-bottom: 24px;
                    }
                    .loader {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 3px solid #E5E7EB;
                        border-top-color: #667eea;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">✓</div>
                    <h1>QR код відскановано!</h1>
                    <p>Перенаправляємо вас на сторінку...</p>
                    <div class="loader"></div>
                </div>
            </body>
            </html>
        `;

        return res.status(200).send(html);
    }

    // ============================================
    // HEALTH CHECK (для моніторингу)
    // ============================================

    /**
     * GET /s/health
     * Перевірка працездатності scan endpoints
     * 
     * @access Public
     */
    healthCheck = async (req, res) => {
        return res.status(200).json({
            success: true,
            message: 'Scan service is healthy',
            timestamp: new Date().toISOString()
        });
    };
}

// ============================================
// EXPORT
// ============================================

export default ScanController;