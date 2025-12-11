const express = require('express');
const router = express.Router();
const medicalFileController = require('../controllers/medicalFile.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const { upload, handleMulterError } = require('../middlewares/upload');
const validate = require('../middlewares/validate');
const { uploadMedicalFileSchema } = require('../validations/medicalFile.validation');
const { ROLES, ROLE_GROUPS } = require('../../config/constants');

/**
 * POST /api/v1/medical-files
 * Upload a medical file (Laborant only)
 */
router.post(
    '/',
    authMiddleware,
    authorize(ROLES.LABORANT),
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
    authorize(ROLES.PATIENT),
    medicalFileController.getMyMedicalFiles
);

/**
 * GET /api/v1/medical-files/my-uploads
 * Get files uploaded by the authenticated laborant
 */
router.get(
    '/my-uploads',
    authMiddleware,
    authorize(ROLES.LABORANT),
    medicalFileController.getMyUploads
);

/**
 * GET /api/v1/medical-files/patient/:patientId
 * Get medical files for a specific patient (Doctor/Admin)
 */
router.get(
    '/patient/:patientId',
    authMiddleware,
    authorize(ROLES.DOCTOR, ROLES.ADMIN),
    medicalFileController.getPatientMedicalFiles
);

/**
 * GET /api/v1/medical-files/laborant/:laborantId
 * Get files uploaded by a specific laborant (Admin only)
 */
router.get(
    '/laborant/:laborantId',
    authMiddleware,
    authorize(ROLES.ADMIN),
    medicalFileController.getLaborantMedicalFiles
);

/**
 * GET /api/v1/medical-files/:fileId/download
 * Download a medical file (protected - requires authentication and authorization)
 * SECURITY: This replaces the public static file serving to prevent unauthorized access
 */
router.get(
    '/:fileId/download',
    authMiddleware,
    medicalFileController.downloadMedicalFile
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
    authorize(ROLES.LABORANT, ROLES.ADMIN),
    medicalFileController.deleteMedicalFile
);

module.exports = router;
