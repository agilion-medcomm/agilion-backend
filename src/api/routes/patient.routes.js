const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');

const  authMiddleware = require('../middlewares/authMiddleware');
const  authorize  = require('../middlewares/authorize');
const  validate  = require('../middlewares/validate');

const { updateProfileSchema } = require('../validations/patient.validation');

// GET /api/v1/patients - Get all patients (requires authentication - for doctor/admin use)
router.get('/', authMiddleware, patientController.getPatients);

router.put('/me/profile', authMiddleware, authorize('PATIENT'), validate(updateProfileSchema), patientController.updateProfile);

module.exports = router;
