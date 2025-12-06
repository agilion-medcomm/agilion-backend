// src/app.js
const express = require('express');
const cors = require('cors'); // We'll need this for React
const { errorHandler } = require("./api/middlewares/errorHandler");
const prisma = require('./config/db');
const app = express();
const { TIMEOUT } = require('./config/constants');

// --- Core Middleware ---
// 1. Enable CORS (Cross-Origin Resource Sharing)
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Enable JSON body parsing
app.use(express.json());

// 3. Enable URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));

// 4. Request timeout middleware
app.use((req, res, next) => {
    req.setTimeout(TIMEOUT.REQUEST_MS);
    next();
});

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
