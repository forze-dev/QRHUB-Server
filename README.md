# QRHub Backend API

Backend для платформи QRHub - створення QR кодів, генерація сайтів та бізнес-аналітика.

## 🚀 Технології

- Node.js + Express
- MongoDB + Mongoose
- Google OAuth 2.0
- JWT Authentication
- Winston Logger

---

## ✅ Що вже зроблено

### 📁 Структура проекту
```
src/
├── controllers/       # HTTP обробка (AuthController)
├── services/          # Бізнес-логіка (AuthService)
├── models/            # MongoDB схеми (User)
├── routes/            # Маршрутизація (authRoutes, index)
├── middleware/        # Middleware (authMiddleware, errorMiddleware, validateMiddleware)
├── utils/             # Утиліти (logger, errorHandler, responseFormatter, connectDB)
├── config/            # Конфігурація (constants, database)
└── app.js             # Express налаштування
```

### 🔐 Аутентифікація (MVP)
- ✅ **Google OAuth 2.0** - повна інтеграція
- ✅ **User Model** - MongoDB схема користувача
- ✅ **AuthService** - авторизація через Google + JWT
- ✅ **AuthController** - HTTP endpoints
- ✅ **JWT токени** - генерація та верифікація
- ✅ **authMiddleware** - захист роутів

---

### 🏢 Бізнеси (Business Module)
- ✅ CRUD операції для бізнесів
- ✅ Slug генерація (транслітерація кирилиці)
- ✅ Завантаження logo у Hetzner S3
- ✅ MVP-ліміт: 1 бізнес на користувача
- ✅ Soft delete
- ✅ Статистика бізнесу
- ✅ Перевірка власника при всіх діях


### 📍 API Endpoints (готові)

#### 🔐 Auth
```
GET    /api/auth/google          
GET    /api/auth/google/callback 
GET    /api/auth/me                  [AUTH]
POST   /api/auth/logout              [AUTH]
POST   /api/auth/refresh             [PUBLIC]
```

#### 🏢 Business
```
GET    /api/businesses               [AUTH]
GET    /api/businesses/:id           [AUTH]
POST   /api/businesses               [AUTH]
PATCH  /api/businesses/:id           [AUTH]
DELETE /api/businesses/:id           [AUTH]
GET    /api/businesses/:id/stats     [AUTH]
GET    /api/businesses/slug/:slug    [PUBLIC]
```

### 🛠️ Інфраструктура
- ✅ **Winston Logger** - логування з кастомними рівнями
- ✅ **Error Handling** - централізована обробка помилок
- ✅ **Response Formatter** - стандартизовані відповіді
- ✅ **Constants** - всі константи проекту
- ✅ **CORS** - налаштовано для фронтенду
- ✅ **Security** - Helmet, rate limiting готові

---

## 📋 Наступні кроки (TODO)

### 1️⃣ **Website Module** (пріоритет)
- [ ] Website Model
- [ ] Product Model (для каталогів)
- [ ] WebsiteService
- [ ] WebsiteController
- [ ] websiteRoutes
- [ ] Cover image upload

### 2️⃣ **QR Code Module**
- [ ] QRCode Model
- [ ] QRCodeService (генерація QR)
- [ ] QRCodeController
- [ ] qrcodeRoutes
- [ ] Інтеграція з Hetzner S3

### 3️⃣ **Analytics Module**
- [ ] QRScan Model
- [ ] QRScan tracking endpoint
- [ ] AnalyticsService (агрегація)
- [ ] AnalyticsController
- [ ] Геолокація + Device detection

### 4️⃣ **Requests Module**
- [ ] Request Model
- [ ] RequestService
- [ ] RequestController
- [ ] Public API для форм

### 5️⃣ **Deploy & Production**
- [ ] Environment для production
- [ ] Hetzner VPS setup
- [ ] MongoDB Atlas
- [ ] Hetzner Object Storage
- [ ] SSL сертифікати
- [ ] PM2 + Nginx

---

## 🔧 Встановлення

```bash
# Клонувати репозиторій
git clone <repo-url>
cd qrhub-backend

# Встановити залежності
npm install

# Створити .env файл
cp .env.example .env

# Заповнити змінні в .env:
# - MONGODB_URI
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - JWT_SECRET
# - FRONTEND_URL

# Запустити сервер
npm run dev
```

---

## 📝 Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/qrhub

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:5500
```

---

## 📚 Архітектура

**Layered Architecture (3-tier):**
- **Controllers** → HTTP обробка, викликають Services
- **Services** → Бізнес-логіка, викликають Models
- **Models** → MongoDB схеми, робота з БД

**Формат відповідей:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

---

## 👨‍💻 Розробка

**Запуск в dev режимі:**
```bash
npm run dev
```

**Тестування OAuth:**
1. Відкрити `test-google-auth.html` в браузері
2. Клікнути "Sign in with Google"
3. Авторизуватися
4. Перевірити токен та дані користувача

---

## 📖 Документація

- **ТЗ:** `qrhub-backend-tz.txt`
- **Концепція:** `QRHub Повна концепція SaaS проекту.pdf`
- **Правила коду:** https://node-js-express-pattern.vercel.app/

---

## 🎯 MVP Timeline

- **Тиждень 1:** ✅ Auth + Business Modules (завершено)
- **Тиждень 2:** Website Modules + QRCode Modules
- **Тиждень 3:** Analytics Modules
- **Тиждень 4:** Testing + Deploy

---

**Статус:** 🟢 Auth Module завершено, готовий до розробки Business Module