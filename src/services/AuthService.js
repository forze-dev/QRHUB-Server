/**
 * AuthService - Google OAuth 2.0 Authentication
 * Бізнес-логіка для аутентифікації користувачів
 * 
 * Flow:
 * 1. Користувач клікає "Sign in with Google" на фронтенді
 * 2. Фронтенд редіректить на /api/auth/google
 * 3. Бекенд редіректить на Google OAuth consent screen
 * 4. Користувач авторизується
 * 5. Google редіректить на /api/auth/google/callback з code
 * 6. Бекенд обмінює code на Google tokens
 * 7. Бекенд отримує профіль користувача з Google
 * 8. Бекенд створює/оновлює користувача в БД
 * 9. Бекенд генерує JWT token
 * 10. Бекенд редіректить на фронтенд з JWT token
 */

import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logInfo, logSuccess, logError, logWarn } from '../utils/logger.js';
import { UnauthorizedError, NotFoundError } from '../utils/errorHandler.js';
import crypto from 'crypto';

class AuthService {
    constructor() {
        // Ініціалізуємо Google OAuth2 Client
        this.oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );

        // OAuth scopes - що ми хочемо отримати від Google
        this.scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ];
    }

    /**
     * Генерує Google OAuth URL для авторизації користувача
     * @returns {String} - Authorization URL
     */
    getGoogleAuthUrl() {
        logInfo('Generating Google OAuth URL');

        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // Отримуємо refresh token
            scope: this.scopes,
            prompt: 'consent', // Форсимо consent screen для refresh token
            state: this.generateState(), // CSRF захист
            redirect_uri: process.env.GOOGLE_CALLBACK_URL
        });

        logSuccess('Google OAuth URL generated successfully');
        return authUrl;
    }

    /**
     * Обробляє Google OAuth callback
     * Обмінює authorization code на tokens і створює/логінить користувача
     * @param {String} code - Authorization code від Google
     * @returns {Object} - { user, token }
     */
    async handleGoogleCallback(code) {
        try {
            logInfo('Processing Google OAuth callback', {
                codePreview: code.substring(0, 10) + '...'
            });

            // 1. Обмінюємо authorization code на tokens
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            logSuccess('Successfully exchanged code for tokens');

            // 2. Верифікуємо ID token і витягуємо user info
            const ticket = await this.oauth2Client.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();

            logInfo('Google user payload received', {
                googleId: payload.sub,
                email: payload.email
            });

            if (!payload.email_verified) {
                throw new UnauthorizedError('Google email not verified');
            }

            // 3. Витягуємо дані користувача з Google
            const googleUser = {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
                avatar: payload.picture
            };

            // 4. Знаходимо або створюємо користувача в БД
            const user = await this.findOrCreateUser(googleUser);

            // 5. Оновлюємо last login
            await user.updateLastLogin();

            // 6. Генеруємо JWT token
            const jwtToken = this.generateJWT(user);

            logSuccess('User authenticated successfully', {
                userId: user._id,
                email: user.email
            });

            return {
                user: this.sanitizeUser(user),
                token: jwtToken
            };

        } catch (error) {
            logError('Google OAuth callback failed', {
                error: error.message,
                stack: error.stack
            });
            throw new UnauthorizedError('Google authentication failed');
        }
    }

    /**
     * Знаходить існуючого користувача або створює нового
     * @param {Object} googleUser - Дані користувача з Google
     * @returns {Object} - User document
     */
    async findOrCreateUser(googleUser) {
        try {
            // Спробуємо знайти користувача по googleId
            let user = await User.findByGoogleId(googleUser.googleId);

            if (user) {
                logInfo('Existing user found', { userId: user._id });

                // Оновлюємо дані якщо вони змінились
                let updated = false;

                if (user.name !== googleUser.name) {
                    user.name = googleUser.name;
                    updated = true;
                }

                if (user.avatar !== googleUser.avatar) {
                    user.avatar = googleUser.avatar;
                    updated = true;
                }

                if (updated) {
                    await user.save();
                    logInfo('User data updated', { userId: user._id });
                }

                return user;
            }

            // Якщо користувача не знайдено - створюємо нового
            logInfo('Creating new user', { email: googleUser.email });

            user = await User.create({
                googleId: googleUser.googleId,
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.avatar,
                isActive: true
            });

            logSuccess('New user created', { userId: user._id });

            return user;

        } catch (error) {
            logError('Error in findOrCreateUser', {
                error: error.message,
                googleUser
            });
            throw error;
        }
    }

    /**
     * Генерує JWT token для користувача
     * @param {Object} user - User document
     * @returns {String} - JWT token
     */
    generateJWT(user) {
        const payload = {
            userId: user._id,
            email: user.email,
            googleId: user.googleId
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '7d',
                issuer: 'qrhub-api'
            }
        );

        logInfo('JWT token generated', { userId: user._id });

        return token;
    }

    /**
     * Верифікує JWT token
     * @param {String} token - JWT token
     * @returns {Object} - Decoded payload
     */
    verifyJWT(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            logWarn('JWT verification failed', { error: error.message });
            throw new UnauthorizedError('Invalid or expired token');
        }
    }

    /**
     * Отримує користувача з БД по ID з JWT
     * @param {String} userId - User ID
     * @returns {Object} - User document
     */
    async getUserById(userId) {
        try {
            const user = await User.findById(userId).select('-__v');

            if (!user) {
                throw new NotFoundError('User not found');
            }

            if (!user.isActive) {
                throw new UnauthorizedError('User account is deactivated');
            }

            return this.sanitizeUser(user);

        } catch (error) {
            logError('Error fetching user by ID', {
                userId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Очищає user object від sensitive полів
     * @param {Object} user - User document
     * @returns {Object} - Sanitized user object
     */
    sanitizeUser(user) {
        const userObj = user.toObject ? user.toObject() : user;

        // Видаляємо sensitive поля
        delete userObj.__v;
        delete userObj.googleId; // Не повертаємо на фронт

        return userObj;
    }

    /**
     * Генерує випадковий state для CSRF захисту
     * @returns {String} - Random state string
     */
    generateState() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Logout користувача (для майбутнього - invalidate token)
     * @param {String} userId - User ID
     * @returns {Boolean}
     */
    async logout(userId) {
        // В майбутньому можна додати blacklist для токенів
        // Або використовувати Redis для session management
        logInfo('User logged out', { userId });
        return true;
    }
}

export default AuthService;