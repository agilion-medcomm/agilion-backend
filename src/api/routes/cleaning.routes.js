const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// const multer = require('multer');
// const path = require('path');

const cleaningController = require('../controllers/cleaning.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const { cleaningPhotoUpload, handleMulterError } = require('../middlewares/upload');
const { ROLES } = require('../../config/constants');
// POST /api/v1/cleaning - Create a new cleaning record
// Requires: authentication, CLEANER or ADMIN role, photo file
router.post(
    '/',
    authMiddleware,
    authorize(ROLES.CLEANER, ROLES.ADMIN),
    cleaningPhotoUpload.single('photo'),
    handleMulterError,
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
    authorize(ROLES.CLEANER, ROLES.ADMIN),
    cleaningController.deleteCleaningRecord
);

module.exports = router;
