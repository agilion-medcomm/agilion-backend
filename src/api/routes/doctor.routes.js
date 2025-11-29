const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/v1/doctors - Get all doctors (requires auth)
router.get('/', authMiddleware, doctorController.getDoctors);

module.exports = router;
