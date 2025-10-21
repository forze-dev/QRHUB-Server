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
├── controllers/       # HTTP обробка (Auth, Business, Website, Product, QRCode, Scan)
├── services/          # Бізнес-логіка (Auth, Business, Website, Product, S3, QRCode, Scan)
├── models/            # MongoDB схеми (User, Business, Website, Product, QRCode, QRScan)
├── routes/            # Маршрутизація (auth, business, website, product, qrcode, scan)
├── validators/        # Joi схеми (business, website, product, qrcode)
├── utils/             # Утиліти (logger, errorHandler, slugGenerator, qrGenerator,shortCodeGenerator, deviceDetector, geolocation,fingerprint)
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

### 📱 QR коди (QR Code Module) ✅
- ✅ **QRCode Model** - MongoDB схема з virtual fields
- ✅ **QRScan Model** - tracking сканувань
- ✅ **QRCodeService** - генерація, CRUD, статистика
- ✅ **ScanService** - обробка сканувань з tracking
- ✅ **QR Generation** - qrcode library (PNG, SVG, Buffer)
- ✅ **Short Code** - nanoid (URL-safe, 8 символів)
- ✅ **S3 Upload** для QR images
- ✅ **MVP-ліміт**: 1 QR код на website
- ✅ **Публічний redirect** через /s/:shortCode
- ✅ **Device detection** - iOS/Android/Desktop
- ✅ **Geolocation** - країна/місто через IP API
- ✅ **Fingerprint tracking** - SHA256 для унікальності
- ✅ **Rate limiting** - захист від спаму (10 сканів/хв)

### 🔍 Tracking (Scan Module) ✅
- ✅ **Device Detector** - User-Agent parsing (ua-parser-js)
- ✅ **Geolocation** - IP → країна/місто (ip-api.com)
- ✅ **Fingerprint** - SHA256 hash для tracking
- ✅ **ScanController** - публічний redirect endpoint
- ✅ **Rate limiting** для захисту
- ✅ **Error pages** - красивий HTML з градієнтом

---

## 📊 **СТАТИСТИКА**

**Всього файлів створено:** `51 файл`

**По категоріях:**
- Models: 6 (User, Business, Website, Product, QRCode, QRScan)
- Services: 7 (Auth, Business, Website, Product, S3, QRCode, Scan)
- Controllers: 6 (Auth, Business, Website, Product, QRCode, Scan)
- Routes: 7 (index, auth, business, website, product, qrcode, scan)
- Validators: 4 (business, website, product, qrcode)
- Utils: 8 (logger, errorHandler, responseFormatter, connectDB, slugGenerator, 
            qrGenerator, shortCodeGenerator, deviceDetector, geolocation, fingerprint)

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

### **QR Code Endpoints:**
```
✅ GET    /api/qrcodes                  - Список QR кодів [AUTH]
✅ GET    /api/qrcodes/:id              - Один QR код [AUTH]
✅ POST   /api/qrcodes                  - Створити QR код [AUTH]
✅ PATCH  /api/qrcodes/:id              - Оновити QR код [AUTH]
✅ DELETE /api/qrcodes/:id              - Видалити QR код [AUTH]
✅ GET    /api/qrcodes/:id/download     - Завантажити QR image [AUTH]
✅ POST   /api/qrcodes/:id/regenerate   - Регенерувати QR [AUTH]
✅ PATCH  /api/qrcodes/:id/toggle       - Перемкнути статус [AUTH]
✅ PATCH  /api/qrcodes/:id/activate     - Активувати [AUTH]
✅ PATCH  /api/qrcodes/:id/deactivate   - Деактивувати [AUTH]
✅ GET    /api/qrcodes/:id/stats        - Статистика QR [AUTH]
```

### **Scan Endpoints (Public):**
```
✅ GET    /scan/health                     - Health check [PUBLIC]
✅ GET    /scan/:shortCode                 - Redirect з tracking [PUBLIC]
✅ GET    /scan/:shortCode/preview         - Preview перед redirect [PUBLIC]
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
- ✅ Користувачі можуть створювати QR коди (MVP: 1 на website)
- ✅ QR images генеруються та завантажуються в Hetzner S3
- ✅ Короткі посилання працюють (/s/abc123)
- ✅ Кожен скан QR трекається (IP, device, geo, fingerprint)
- ✅ Device detection визначає iOS/Android/Desktop
- ✅ Geolocation визначає країну та місто
- ✅ Fingerprint tracking для унікальних користувачів
- ✅ Rate limiting захищає від спаму (10 сканів/хв)
- ✅ QRCode.totalScans та uniqueScans оновлюються автоматично
- ✅ Красиві error pages при помилках сканування

---

## 📋 **ЩО ТРЕБА ЗРОБИТИ ДАЛІ**

### **НАСТУПНИЙ МОДУЛЬ: Analytics Module** 🎯

#### **Пріоритет 1 - Analytics Module (Тиждень 1):** ⏳

**Файли:**
```
⏳ src/services/AnalyticsService.js
⏳ src/controllers/AnalyticsController.js
⏳ src/routes/analyticsRoutes.js
⏳ src/validators/analyticsValidator.js
```

**Функціонал Analytics:**
- Агрегація даних з QRScan collection
- Графіки сканувань по датах
- Години пік (0-23)
- Топ-10 країн та міст
- Розподіл iOS/Android/Desktop
- Унікальні vs повторні користувачі
- Dashboard для бізнесу та користувача

---

#### **Пріоритет 2 - Requests Module (Тиждень 2):**
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

#### **Пріоритет 3 - Testing & Deploy (Тиждень 3):**
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
✅ Тиждень 2: Website + Product Module (100% ✅)
⏳ Тиждень 3: QR Code Module (100% ✅) + Analytics (0%) + Requests (0%)
⏳ Тиждень 4: Testing + Deploy (0%)
```

**Загальний прогрес:** `66% / 100%` 🎯

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

5. **Створити QR Code:**
   - POST `/api/qrcodes` (application/json)
   - Поля: businessId, websiteId, name, targetUrl, primaryColor, backgroundColor

6. **Сканувати QR:**
   - GET `/s/{shortCode}` (без auth, публічний)
   - Перевірити redirect
   - Перевірити QRScan запис в БД
   - Перевірити інкремент QRCode.totalScans

7. **Публічний доступ:**
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

**Поточна версія:** `v0.6.0`