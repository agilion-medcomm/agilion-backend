const appointmentService = require('../../services/appointment.service');

/**
 * GET /api/v1/appointments
 * Query params:
 * - list=true: return full appointment list for doctor panel
 * - doctorId + date: return booked times for appointment booking
 */
const getAppointments = async (req, res, next) => {
    try {
        const { doctorId, date, list, patientId } = req.query;

        // A) Full list for doctor/admin panel
        if (list === 'true') {
            const filters = {};
            if (doctorId) filters.doctorId = doctorId;
            if (patientId) filters.patientId = patientId;

            const appointments = await appointmentService.getAppointmentsList(filters);
            return res.json({ status: 'success', data: appointments });
        }

        // B) Booked times for appointment creation (including leave-blocked slots)
        if (doctorId && date) {
            const bookedTimes = await appointmentService.getBookedTimesForDoctor(doctorId, date);
            return res.json({ status: 'success', data: { bookedTimes } });
        }

        return res.json({ status: 'success', data: { bookedTimes: [] } });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/appointments
 * Create new appointment
 */
const createAppointment = async (req, res, next) => {
    try {
        const appointment = await appointmentService.createAppointment(req.user.userId, req.body);

        res.status(201).json({
            status: 'success',
            message: 'Appointment created successfully.',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/appointments/:id/status
 * Update appointment status (CANCELLED, APPROVED, etc.)
 */
const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const appointment = await appointmentService.updateAppointmentStatus(id, status);

        res.json({
            status: 'success',
            message: 'Appointment status updated.',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAppointments,
    createAppointment,
    updateAppointmentStatus,
};
