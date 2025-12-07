const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const cleaningController = require('../controllers/cleaning.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
        }
    },
});

// POST /api/v1/cleaning - Create a new cleaning record
// Requires: authentication, CLEANER or ADMIN role, photo file
router.post(
    '/',
    authMiddleware,
    authorize('CLEANER', 'ADMIN'),
    upload.single('photo'),
    cleaningController.createCleaningRecord
);

// GET /api/v1/cleaning - Get cleaning records with filters
// Query params: date (YYYY-MM-DD), area, personnelId
router.get(
    '/',
    authMiddleware,
    cleaningController.getCleaningRecords
);

// GET /api/v1/cleaning/date/:date - Get cleaning records for a specific date
router.get(
    '/date/:date',
    authMiddleware,
    cleaningController.getCleaningRecordsByDate
);

// GET /api/v1/cleaning/personnel/:personnelId - Get records for a specific personnel
// Query param: date (optional, YYYY-MM-DD)
router.get(
    '/personnel/:personnelId',
    authMiddleware,
    cleaningController.getCleaningRecordsByPersonnel
);

// DELETE /api/v1/cleaning/:recordId - Delete a cleaning record
router.delete(
    '/:recordId',
    authMiddleware,
    authorize('CLEANER', 'ADMIN'),
    cleaningController.deleteCleaningRecord
);

module.exports = router;
