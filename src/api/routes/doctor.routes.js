const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');

// GET /api/v1/doctors - Public endpoint
router.get('/', doctorController.getDoctors);

module.exports = router;
