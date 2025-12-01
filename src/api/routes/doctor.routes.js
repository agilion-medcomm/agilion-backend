const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/v1/doctors - Get all doctors (public endpoint)
router.get('/', doctorController.getDoctors);

module.exports = router;
