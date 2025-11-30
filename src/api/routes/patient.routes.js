const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/v1/patients - Get all patients (requires authentication - for doctor/admin use)
router.get('/', authMiddleware, patientController.getPatients);

module.exports = router;
