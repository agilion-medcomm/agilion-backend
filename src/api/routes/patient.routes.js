const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');

const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { sanitizeBody } = require('../middlewares/sanitize');

const { updateProfileSchema, changePasswordSchema } = require('../validations/patient.validation');
const { ROLES, ROLE_GROUPS } = require('../../config/constants');

const requireAdmin = require('../middlewares/requireAdmin');

// GET /api/v1/patients - Get all patients (requires authentication - for doctor/admin use)
router.get('/', authMiddleware, patientController.getPatients);

// GET /api/v1/patients/search?tckn=... - Search patient by TCKN (admin, doctor, cashier, laborant)
router.get('/search', authMiddleware, authorize(...ROLE_GROUPS.PERSONNEL), patientController.getPatientByTCKN);

router.put('/me/profile', authMiddleware, authorize(ROLES.PATIENT), sanitizeBody, validate(updateProfileSchema), patientController.updateProfile);

// PUT /api/v1/patients/me/change-password
router.put('/me/change-password', authMiddleware, authorize(ROLES.PATIENT), validate(changePasswordSchema), patientController.changePassword);

// DELETE /api/v1/patients/:id - Delete patient (admin only)
router.delete('/:id', authMiddleware, requireAdmin, patientController.deletePatient);

module.exports = router;
