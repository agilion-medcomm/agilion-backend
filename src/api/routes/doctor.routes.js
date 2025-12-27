const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/v1/doctors - Get all doctors (public endpoint)
router.get('/', doctorController.getDoctors);

// PUT /api/v1/doctors/:id/profile - Update doctor profile (authenticated)
router.put('/:id/profile', authMiddleware, doctorController.updateDoctorProfile);

module.exports = router;
