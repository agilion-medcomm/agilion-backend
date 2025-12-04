const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');

const  authMiddleware = require('../middlewares/authMiddleware');
const  authorize  = require('../middlewares/authorize');
const  validate  = require('../middlewares/validate');

const { updateProfileSchema, changePasswordSchema } = require('../validations/patient.validation');

// GET /api/v1/patients - Get all patients (requires authentication - for doctor/admin use)
router.get('/', authMiddleware, patientController.getPatients);

// GET /api/v1/patients/search?tckn=... - Search patient by TCKN (admin, doctor, cashier only)
router.get('/search', authMiddleware, authorize('ADMIN', 'DOCTOR', 'CASHIER'), patientController.getPatientByTCKN);

router.put('/me/profile', authMiddleware, authorize('PATIENT'), validate(updateProfileSchema), patientController.updateProfile);

// PUT /api/v1/patients/me/change-password
router.put('/me/change-password', authMiddleware, authorize('PATIENT'), validate(changePasswordSchema), patientController.changePassword );

module.exports = router;
