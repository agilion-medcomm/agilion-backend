const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/v1/appointments - Public for booking, requires auth for list
router.get('/', appointmentController.getAppointments);

// POST /api/v1/appointments - Create appointment (requires auth)
router.post('/', authMiddleware, appointmentController.createAppointment);

// PUT /api/v1/appointments/:id/status - Update status (requires auth)
router.put('/:id/status', authMiddleware, appointmentController.updateAppointmentStatus);

module.exports = router;
