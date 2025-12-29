const appointmentService = require('../../services/appointment.service');
const { sendSuccess, sendCreated } = require('../../utils/responseFormatter');
const { parseAndValidateId } = require('../../utils/idValidator');

const prisma = require('../config/db');

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

            // If user is a DOCTOR, enforce their own doctorId
            if (req.user.role === 'DOCTOR') {
                const doctor = await prisma.doctor.findUnique({
                    where: { userId: req.user.userId }
                });

                if (doctor) {
                    filters.doctorId = doctor.id;
                }
            } else if (doctorId) {
                // For admins, allow filtering by any doctorId
                filters.doctorId = doctorId;
            }

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
        const id = parseAndValidateId(req.params.id, 'appointment ID');
        const { status } = req.body;

        const appointment = await appointmentService.updateAppointmentStatus(id, status);

        sendSuccess(res, appointment, 'Appointment status updated.');
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/appointments/:id/rate
 * Rate a completed appointment (PATIENT only)
 */
const rateAppointment = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'appointment ID');
        const { rating } = req.body;

        const ratedAppointment = await appointmentService.rateAppointment(
            id,
            req.user.userId,
            rating
        );

        sendSuccess(res, ratedAppointment, 'Randevu başarıyla değerlendirildi.');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAppointments,
    createAppointment,
    updateAppointmentStatus,
    rateAppointment,
};
