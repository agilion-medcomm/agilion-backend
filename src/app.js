// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require("./api/middlewares/errorHandler");
const prisma = require('./config/db');
const { TIMEOUT, RATE_LIMIT, SECURITY } = require('./config/constants');

const app = express();

// Trust proxy when behind load balancer (required for correct IP in rate limiting)
if (SECURITY.TRUST_PROXY) {
    app.set('trust proxy', 1);
}

// --- Security Middleware ---
// Helmet - Security headers (can be disabled for debugging)
if (SECURITY.HELMET_ENABLED) {
    app.use(helmet({
        contentSecurityPolicy: SECURITY.CSP_ENABLED ? {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "blob:"],
            },
        } : false,
        crossOriginEmbedderPolicy: false, // For file downloads
    }));
}

// Rate Limiting - General API
const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    message: { status: 'error', message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiting - Strict for auth endpoints
const authLimiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.LOGIN_MAX_ATTEMPTS,
    message: { status: 'error', message: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiters (can be disabled via RATE_LIMIT_ENABLED=false)
if (RATE_LIMIT.ENABLED) {
    app.use('/api/v1', apiLimiter);
    app.use('/api/v1/auth/login', authLimiter);
    app.use('/api/v1/auth/personnel/login', authLimiter);
    app.use('/api/v1/auth/request-password-reset', authLimiter);
}

// --- Core Middleware ---
// 1. Enable CORS (Cross-Origin Resource Sharing)
app.use(cors({
    origin: SECURITY.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Enable JSON body parsing with size limit
app.use(express.json({ limit: '1mb' }));

// 3. Enable URL-encoded body parsing with size limit
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Request timeout middleware
app.use((req, res, next) => {
    req.setTimeout(TIMEOUT.REQUEST_MS);
    next();
});

// Serve static files for profile/personnel photos and cleaning photos (publicly accessible)
const path = require('path');
app.use('/uploads/profile-photos', express.static(path.join(process.cwd(), 'uploads/profile-photos')));
app.use('/uploads/personnel-photos', express.static(path.join(process.cwd(), 'uploads/personnel-photos')));
app.use('/uploads/cleaning-photos', express.static(path.join(process.cwd(), 'uploads/cleaning-photos')));

// SECURITY: Do NOT serve static files for medical uploads
// Medical files must go through authenticated API endpoints
// See: GET /api/v1/medical-files/:fileId/download

// --- API Routes ---
// Health check endpoint with database connectivity check
app.get('/api/v1/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ 
            status: 'UP', 
            service: 'Hospital API',
            database: 'connected'
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'DOWN', 
            service: 'Hospital API',
            database: 'disconnected'
        });
    }
});

const mainRouter = require('./api/routes/index.js');
app.use('/api/v1', mainRouter);

// --- Error Handling Middleware ---
app.use(errorHandler);

module.exports = app;
