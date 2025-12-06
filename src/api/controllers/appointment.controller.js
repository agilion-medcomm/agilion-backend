const appointmentService = require('../../services/appointment.service');
const { sendSuccess, sendCreated } = require('../../utils/responseFormatter');

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
            return sendSuccess(res, appointments);
        }

        // B) Booked times for appointment creation (including leave-blocked slots)
        if (doctorId && date) {
            const bookedTimes = await appointmentService.getBookedTimesForDoctor(doctorId, date);
            return sendSuccess(res, { bookedTimes });
        }

        return sendSuccess(res, { bookedTimes: [] });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/appointments
 * Create new appointment
 * - PATIENT: creates appointment for themselves
 * - CASHIER: creates appointment for a patient (patientId required in body)
 * - ADMIN/DOCTOR: can create for themselves or specify patientId
 */
const createAppointment = async (req, res, next) => {
    try {
        const appointment = await appointmentService.createAppointment(
            req.user.userId,
            req.user.role,
            req.body
        );

        sendCreated(res, appointment, 'Appointment created successfully.');
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

        sendSuccess(res, appointment, 'Appointment status updated.');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAppointments,
    createAppointment,
    updateAppointmentStatus,
};
