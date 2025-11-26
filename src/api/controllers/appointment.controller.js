const prisma = require('../../config/db');
const appointmentRepository = require('../../repositories/appointment.repository');
const leaveRequestRepository = require('../../repositories/leaveRequest.repository');
const { ApiError } = require('../middlewares/errorHandler');

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

            const appointments = await appointmentRepository.getAppointments(filters);
            
            // Map to frontend format
            const formatted = appointments.map(app => ({
                id: app.id,
                doctorId: app.doctorId,
                doctorName: `${app.doctor.user.firstName} ${app.doctor.user.lastName}`,
                patientId: app.patientId,
                patientFirstName: app.patient.user.firstName,
                patientLastName: app.patient.user.lastName,
                date: app.date,
                time: app.time,
                status: app.status,
                createdAt: app.createdAt,
            }));

            return res.json({ status: 'success', data: formatted });
        }

        // B) Booked times for appointment creation (including leave-blocked slots)
        if (doctorId && date) {
            const bookedTimes = await appointmentRepository.getBookedTimes(doctorId, date);
            
            // Get approved leaves and calculate blocked slots
            const approvedLeaves = await leaveRequestRepository.getApprovedLeaves(doctorId);
            
            // Parse date from DD.MM.YYYY to check leave overlap
            const [day, month, year] = date.split('.');
            const dailySlots = [];
            for (let h = 9; h <= 17; h++) {
                for (let m of [0, 30]) {
                    if (h === 17 && m > 0) continue;
                    dailySlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                }
            }

            dailySlots.forEach(slot => {
                const [h, m] = slot.split(':');
                const slotDate = new Date(year, month - 1, day, h, m);

                const isBlockedByLeave = approvedLeaves.some(leave => {
                    const leaveStart = new Date(`${leave.startDate}T${leave.startTime}`);
                    const leaveEnd = new Date(`${leave.endDate}T${leave.endTime}`);
                    return slotDate >= leaveStart && slotDate < leaveEnd;
                });

                if (isBlockedByLeave && !bookedTimes.includes(slot)) {
                    bookedTimes.push(slot);
                }
            });

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
        const { doctorId, date, time, status } = req.body;

        if (!doctorId || !date || !time) {
            throw new ApiError(400, 'Missing required fields.');
        }

        // Get patientId from authenticated user
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { patient: true },
        });

        if (!user || !user.patient) {
            throw new ApiError(400, 'Patient profile not found.');
        }

        const appointment = await appointmentRepository.createAppointment({
            doctorId,
            patientId: user.patient.id,
            date,
            time,
            status: status || 'APPROVED',
        });

        res.status(201).json({
            status: 'success',
            message: 'Appointment created successfully.',
            data: {
                id: appointment.id,
                doctorId: appointment.doctorId,
                doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
                patientId: appointment.patientId,
                patientFirstName: appointment.patient.user.firstName,
                patientLastName: appointment.patient.user.lastName,
                date: appointment.date,
                time: appointment.time,
                status: appointment.status,
                createdAt: appointment.createdAt,
            },
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

        if (!status) {
            throw new ApiError(400, 'Status is required.');
        }

        const appointment = await appointmentRepository.updateAppointmentStatus(id, status);

        res.json({
            status: 'success',
            message: 'Appointment status updated.',
            data: { id: appointment.id, status: appointment.status },
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
