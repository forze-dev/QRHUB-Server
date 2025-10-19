# QRHub Backend API

Backend для платформи QRHub - створення QR кодів, генерація сайтів та бізнес-аналітика.

## 🚀 Технології

- Node.js + Express
- MongoDB + Mongoose
- Google OAuth 2.0
- JWT Authentication
- Hetzner S3 Object Storage
- Winston Logger

---

## ✅ Що вже зроблено

### 📁 Структура проекту
```
src/
├── controllers/       # HTTP обробка (Auth, Business, Website, Product)
├── services/          # Бізнес-логіка (Auth, Business, Website, Product, S3)
├── models/            # MongoDB схеми (User, Business, Website, Product)
├── routes/            # Маршрутизація (auth, business, website, product)
├── middleware/        # Middleware (auth, error, validate, upload)
├── validators/        # Joi схеми (business, website, product)
├── utils/             # Утиліти (logger, errorHandler, responseFormatter, slugGenerator)
├── config/            # Конфігурація (constants, database)
└── app.js             # Express налаштування
```

### 🔐 Аутентифікація (Auth Module) ✅
- ✅ **Google OAuth 2.0** - повна інтеграція
- ✅ **User Model** - MongoDB схема користувача
- ✅ **AuthService** - авторизація через Google + JWT
- ✅ **AuthController** - HTTP endpoints
- ✅ **JWT токени** - генерація та верифікація
- ✅ **authMiddleware** - захист роутів

### 🏢 Бізнеси (Business Module) ✅
- ✅ **CRUD операції** для бізнесів
- ✅ **Slug генерація** (транслітерація кирилиці)
- ✅ **Завантаження logo** у Hetzner S3
- ✅ **MVP-ліміт**: 1 бізнес на користувача
- ✅ **Soft delete**
- ✅ **Статистика бізнесу**
- ✅ **Перевірка власника** при всіх діях

### 🌐 Сайти (Website Module) ✅
- ✅ **Website Model** з 3 типами (card, catalog, external)
- ✅ **Product Model** для каталогів
- ✅ **WebsiteService** - повна бізнес-логіка
- ✅ **ProductService** - управління товарами
- ✅ **Slug генерація** (business.slug + суфікс -1, -2)
- ✅ **Cover image upload** у Hetzner S3
- ✅ **Product images** у Hetzner S3
- ✅ **MVP-ліміт**: 1 сайт на бізнес, 50 товарів на каталог
- ✅ **Публічний доступ** до сайтів по slug
- ✅ **Bulk order update** для drag-and-drop товарів

---

## 📊 **СТАТИСТИКА**

**Всього файлів створено:** `39 файлів`

**По категоріях:**
- Models: 4 (User, Business, Website, Product)
- Services: 5 (Auth, Business, Website, Product, S3)
- Controllers: 4 (Auth, Business, Website, Product)
- Routes: 5 (index, auth, business, website, product)
- Middleware: 4 (auth, error, validate, upload)
- Validators: 3 (business, website, product)
- Utils: 5 (logger, errorHandler, responseFormatter, connectDB, slugGenerator)
- Config: 2 (constants, database)
- Root: 5 (server, .env.example, .gitignore, package.json, README)

---

## 🔐 **API ENDPOINTS (готові до тестування)**

### **Auth Endpoints:**
```
✅ GET  /api/auth/google          - Початок OAuth flow
✅ GET  /api/auth/google/callback - Callback від Google
✅ GET  /api/auth/me              - Поточний користувач [AUTH]
✅ POST /api/auth/logout          - Вихід [AUTH]
✅ POST /api/auth/refresh         - Оновити токен [PUBLIC]
```

### **Business Endpoints:**
```
✅ GET    /api/businesses                - Список бізнесів [AUTH]
✅ GET    /api/businesses/:id            - Один бізнес [AUTH]
✅ POST   /api/businesses                - Створити бізнес [AUTH]
✅ PATCH  /api/businesses/:id            - Оновити бізнес [AUTH]
✅ DELETE /api/businesses/:id            - Видалити бізнес [AUTH]
✅ GET    /api/businesses/:id/stats      - Статистика [AUTH]
✅ GET    /api/businesses/slug/:slug     - По slug [PUBLIC]
```

### **Website Endpoints:**
```
✅ GET    /api/websites                  - Список сайтів [AUTH]
✅ GET    /api/websites/:id              - Один сайт [AUTH]
✅ POST   /api/websites                  - Створити сайт [AUTH]
✅ PATCH  /api/websites/:id              - Оновити сайт [AUTH]
✅ DELETE /api/websites/:id              - Видалити сайт [AUTH]
✅ GET    /api/websites/:id/stats        - Статистика [AUTH]
✅ GET    /api/websites/slug/:slug       - По slug [PUBLIC]
```

### **Product Endpoints:**
```
✅ GET    /api/websites/:websiteId/products  - Товари сайту [PUBLIC]
✅ GET    /api/products/:id                  - Один товар [AUTH]
✅ POST   /api/products                      - Створити товар [AUTH]
✅ PATCH  /api/products/:id                  - Оновити товар [AUTH]
✅ DELETE /api/products/:id                  - Видалити товар [AUTH]
✅ PATCH  /api/products/bulk-order           - Масове оновлення порядку [AUTH]
✅ PATCH  /api/products/:id/toggle-availability - Перемкнути доступність [AUTH]
```

---

## 🚀 **ЩО ПРАЦЮЄ ЗАРАЗ**

### **Інфраструктура:**
- ✅ Express сервер з усіма middleware
- ✅ MongoDB підключення через Mongoose
- ✅ Winston Logger (файли + консоль)
- ✅ Error Handling (dev/prod режими)
- ✅ CORS налаштовано
- ✅ Helmet security
- ✅ Rate limiting готово
- ✅ Compression
- ✅ Graceful shutdown
- ✅ Hetzner S3 Object Storage інтеграція

### **Функціонал:**
- ✅ Користувачі можуть авторизуватись через Google
- ✅ JWT токени генеруються та перевіряються
- ✅ Користувачі можуть створювати бізнеси (MVP: 1 на user)
- ✅ Logo завантажується в Hetzner S3
- ✅ Slug генерується автоматично з кирилиці
- ✅ Бізнеси можна редагувати/видаляти
- ✅ Статистика бізнесу (лічильники)
- ✅ Користувачі можуть створювати сайти (MVP: 1 на бізнес)
- ✅ 3 типи сайтів: card (візитка), catalog (каталог), external (зовнішній)
- ✅ Cover images завантажуються в Hetzner S3
- ✅ Товари можна додавати до каталогів (MVP: 50 на каталог)
- ✅ Product images завантажуються в Hetzner S3
- ✅ Публічний доступ до сайтів через slug
- ✅ Drag-and-drop товарів (bulk order update)
- ✅ Перевірка власника при всіх операціях

---

## 📋 **ЩО ТРЕБА ЗРОБИТИ ДАЛІ**

### **НАСТУПНИЙ МОДУЛЬ: QR Code Module** 🎯

#### **Пріоритет 1 - QR Code (Тиждень 3):**

**1. Models:**
```
⏳ src/models/QRCode.js
⏳ src/models/QRScan.js
```

**2. Services:**
```
⏳ src/services/QRCodeService.js
⏳ src/utils/qrGenerator.js
```

**3. Controllers:**
```
⏳ src/controllers/QRCodeController.js
```

**4. Routes:**
```
⏳ src/routes/qrcodeRoutes.js
```

**5. Validators:**
```
⏳ src/validators/qrcodeValidator.js
```

**Функціонал QR Code:**
- Генерація QR кодів для websites
- Короткі посилання (/s/:shortCode)
- Tracking сканувань (QRScan model)
- Завантаження QR image в S3
- Інкремент Business.qrCodesCount

---

#### **Пріоритет 2 - Analytics Module (Тиждень 3):**
**Файли:**
```
⏳ src/services/AnalyticsService.js
⏳ src/controllers/AnalyticsController.js
⏳ src/routes/analyticsRoutes.js
```

**Функціонал Analytics:**
- Агрегація сканувань QR кодів
- Статистика по датах
- Геолокація (країна/місто)
- Device detection (iOS/Android/Desktop)
- Dashboard для користувача

---

#### **Пріоритет 3 - Requests Module (Тиждень 3):**
**Файли:**
```
⏳ src/models/Request.js
⏳ src/services/RequestService.js
⏳ src/controllers/RequestController.js
⏳ src/routes/requestRoutes.js
⏳ src/validators/requestValidator.js
```

**Функціонал Requests:**
- Форми зворотного зв'язку з сайтів
- Замовлення з каталогів
- Public API для прийому заявок
- Інкремент Business.totalRequests

---

#### **Пріоритет 4 - Testing & Deploy (Тиждень 4):**
**Файли:**
```
⏳ tests/unit/
⏳ tests/integration/
⏳ tests/e2e/
⏳ swagger.yaml
```

**Завдання:**
- Manual тестування всіх endpoints
- Написання тестів (Jest + Supertest)
- Swagger документація
- Deploy на Hetzner VPS
- Налаштування PM2 + Nginx
- SSL сертифікати

---

## 📊 **ПРОГРЕС MVP**

```
✅ Тиждень 1: Auth + Business Module (100% ✅)
✅ Тиждень 2: Website Module (100% ✅)
⏳ Тиждень 3: QR Code + Analytics + Requests (0%)
⏳ Тиждень 4: Testing + Deploy (0%)
```

**Загальний прогрес:** `50% / 100%` 🎯

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
# - HETZNER_S3_* (credentials)

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

# Hetzner Object Storage (S3-compatible)
HETZNER_S3_ENDPOINT=https://fsn1.your-objectstorage.com
HETZNER_S3_REGION=fsn1
HETZNER_S3_ACCESS_KEY=your-access-key
HETZNER_S3_SECRET_KEY=your-secret-key
HETZNER_S3_BUCKET=qrhub-storage
HETZNER_CDN_URL=https://cdn.qrhub.online (optional)

# Public Site URL
PUBLIC_SITE_URL=http://localhost:3000
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

**File Upload Flow:**
```
Client → Multer (memory storage) → S3Service → Hetzner S3
                                              ↓
                                         Public URL
```

---

## 👨‍💻 Розробка

**Запуск в dev режимі:**
```bash
npm run dev
```

**Тестування через Postman/Insomnia:**

1. **Auth Flow:**
   - GET `/api/auth/google` → авторизація
   - Отримати JWT token
   - Використовувати в header: `Authorization: Bearer <token>`

2. **Створити Business:**
   - POST `/api/businesses` (multipart/form-data)
   - Поля: name, description, logo (file)

3. **Створити Website:**
   - POST `/api/websites` (multipart/form-data)
   - Поля: businessId, type, metaTitle, coverImage (file)

4. **Створити Products (якщо type='catalog'):**
   - POST `/api/products` (multipart/form-data)
   - Поля: websiteId, name, price, image (file)

5. **Публічний доступ:**
   - GET `/api/websites/slug/:slug` (без auth)
   - GET `/api/websites/:websiteId/products` (без auth)

---

## 📖 Документація

- **ТЗ:** `qrhub-backend-tz.txt`
- **Концепція:** `QRHub Повна концепція SaaS проекту.pdf`
- **Правила коду:** https://node-js-express-pattern.vercel.app/

---

## 🎯 MVP Timeline

- **Тиждень 1:** ✅ Auth + Business Modules (завершено)
- **Тиждень 2:** ✅ Website + Product Modules (завершено)
- **Тиждень 3:** ⏳ QR Code + Analytics + Requests Modules
- **Тиждень 4:** ⏳ Testing + Deploy

---

**Статус:** 🟢 Website Module завершено, готовий до розробки QR Code Module

**Поточна версія:** `v0.4.0`