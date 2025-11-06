// src/app.js
const express = require('express');
const cors = require('cors'); // We'll need this for React
const { errorHandler } = require("./api/middlewares/errorHandler");
const app = express();

// --- Core Middleware ---
// 1. Enable CORS (Cross-Origin Resource Sharing)
app.use(cors()); // In production, configure this with specific origins

// 2. Enable JSON body parsing
app.use(express.json());

// 3. Enable URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));


// --- API Routes ---
// A simple test route
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
