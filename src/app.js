// src/app.js
const express = require('express');
const cors = require('cors'); // We'll need this for React
const { errorHandler } = require("./api/middlewares/errorHandler");
const app = express();

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

// 4. Do NOT serve cleaning photo uploads as static files.
// Cleaning photo downloads should be handled via a protected API endpoint (see medical files approach).

// --- API Routes ---
// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'Hospital API' });
});

// TODO: We will later import and mount our main router here
const mainRouter = require('./api/routes/index.js');
app.use('/api/v1', mainRouter);


// --- Error Handling Middleware ---
// TODO: We will add a global error handler here
app.use(errorHandler);
module.exports = app; // Export the configured app
