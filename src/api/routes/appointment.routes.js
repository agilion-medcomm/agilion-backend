const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');
const authorize = require('../middlewares/authorize');

// GET /api/v1/appointments - Get appointments (public for slot checking, auth for lists)
router.get('/', optionalAuth, appointmentController.getAppointments);

// POST /api/v1/appointments - Create appointment (PATIENT, CASHIER only)
router.post('/', authMiddleware, authorize('PATIENT', 'CASHIER'), appointmentController.createAppointment);

// PUT /api/v1/appointments/:id/status - Update status (requires auth)
router.put('/:id/status', authMiddleware, appointmentController.updateAppointmentStatus);

module.exports = router;
