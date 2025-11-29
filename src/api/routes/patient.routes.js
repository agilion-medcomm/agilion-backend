const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');

// GET /api/v1/patients - Get all patients
router.get('/', patientController.getPatients);

module.exports = router;
