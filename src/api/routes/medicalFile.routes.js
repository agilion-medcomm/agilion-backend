const express = require('express');
const router = express.Router();
const medicalFileController = require('../controllers/medicalFile.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const { upload, handleMulterError } = require('../middlewares/upload');
const validate = require('../middlewares/validate');
const { uploadMedicalFileSchema } = require('../validations/medicalFile.validation');

/**
 * POST /api/v1/medical-files
 * Upload a medical file (Laborant only)
 */
router.post(
    '/',
    authMiddleware,
    authorize('LABORANT'),
    upload.single('file'),
    handleMulterError,
    validate(uploadMedicalFileSchema),
    medicalFileController.uploadMedicalFile
);

/**
 * GET /api/v1/medical-files/my
 * Get medical files for the authenticated patient
 */
router.get(
    '/my',
    authMiddleware,
    authorize('PATIENT'),
    medicalFileController.getMyMedicalFiles
);

/**
 * GET /api/v1/medical-files/patient/:patientId
 * Get medical files for a specific patient (Doctor/Admin)
 */
router.get(
    '/patient/:patientId',
    authMiddleware,
    authorize('DOCTOR', 'ADMIN'),
    medicalFileController.getPatientMedicalFiles
);

/**
 * GET /api/v1/medical-files/laborant/:laborantId
 * Get files uploaded by a specific laborant (Admin only)
 */
router.get(
    '/laborant/:laborantId',
    authMiddleware,
    authorize('ADMIN'),
    medicalFileController.getLaborantMedicalFiles
);

/**
 * GET /api/v1/medical-files/:fileId
 * Get a single medical file by ID
 */
router.get(
    '/:fileId',
    authMiddleware,
    medicalFileController.getMedicalFileById
);

/**
 * DELETE /api/v1/medical-files/:fileId
 * Delete a medical file (Laborant who uploaded it, or Admin)
 */
router.delete(
    '/:fileId',
    authMiddleware,
    authorize('LABORANT', 'ADMIN'),
    medicalFileController.deleteMedicalFile
);

module.exports = router;
