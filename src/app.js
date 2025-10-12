import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { logInfo } from './utils/logger.js';

// Middleware imports
import errorMiddleware, { notFoundMiddleware } from './middleware/errorMiddleware.js';

// Routes imports (створимо пізніше)
// import routes from './routes/index.js';

// Ініціалізація Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - захист HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// ============================================
// CORS CONFIGURATION
// ============================================

// CORS - дозволяємо запити з фронтенду
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL,     // http://localhost:3000
        process.env.SITE_URL,         // http://site.localhost:3000
        'http://localhost:3000',       // Fallback для dev
        'http://localhost:3001',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// ============================================
// LOGGING MIDDLEWARE
// ============================================

// Morgan - HTTP request logger (тільки для development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Production - custom morgan format
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
}

// ============================================
// BODY PARSER MIDDLEWARE
// ============================================

// JSON parser
app.use(express.json({
    limit: '10mb'
}));

// URL-encoded parser
app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

// ============================================
// COMPRESSION
// ============================================

// Compression - стиснення відповідей
app.use(compression());

// ============================================
// STATIC FILES
// ============================================

// Статичні файли (uploads, qrcodes)
app.use('/uploads', express.static('public/uploads'));
app.use('/qrcodes', express.static('public/qrcodes'));

// ============================================
// HEALTH CHECK
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// API info endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'QRHub API Server',
        version: '1.0.0',
        docs: '/api-docs'
    });
});

// ============================================
// API ROUTES
// ============================================

// Підключаємо всі routes (створимо пізніше)
// app.use('/api', routes);

// Тимчасовий роут для тестування
app.get('/api/test', (req, res) => {
    logInfo('Test endpoint called');
    res.json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler - для неіснуючих роутів
app.use(notFoundMiddleware);

// Global Error Handler - має бути останнім middleware
app.use(errorMiddleware);

// ============================================
// EXPORT
// ============================================

export default app;