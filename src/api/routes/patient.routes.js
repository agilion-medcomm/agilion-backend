const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');

const { authMiddleware, authorize } = require('../middlewares/authMiddleware');

// GET /api/v1/patients - Get all patients
router.get('/', patientController.getPatients);

module.exports = router;
