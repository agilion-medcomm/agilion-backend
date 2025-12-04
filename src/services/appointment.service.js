const appointmentRepository = require('../repositories/appointment.repository');
const leaveRequestRepository = require('../repositories/leaveRequest.repository');
const { ApiError } = require('../api/middlewares/errorHandler');
const prisma = require('../config/db');
const {
    parseAppointmentDate,
    validateAppointmentDateFormat,
    validateTimeFormat,
    createDateTimeFromISO,
} = require('../utils/dateTimeValidator');

/**
 * Get appointments list for doctor/admin panel
 */
const getAppointmentsList = async (filters) => {
    const appointments = await appointmentRepository.getAppointments(filters);
    
    return appointments.map(app => ({
        id: app.id,
        doctorId: app.doctorId,
        doctorName: `${app.doctor.user.firstName} ${app.doctor.user.lastName}`,
        patientId: app.patientId,
        patientFirstName: app.patient.user.firstName,
        patientLastName: app.patient.user.lastName,
        date: app.date,
        time: app.time,
        status: app.status,
        department: app.doctor.specialization || '-',
        createdAt: app.createdAt,
    }));
};

/**
 * Get booked times for appointment creation (including leave-blocked slots)
 */
const getBookedTimesForDoctor = async (doctorId, date) => {
    // Validate and parse date
    const { day, month, year } = parseAppointmentDate(date);
    
    const bookedTimes = await appointmentRepository.getBookedTimes(doctorId, date);
    
    // Get approved leaves and calculate blocked slots
    const approvedLeaves = await leaveRequestRepository.getApprovedLeaves(doctorId);
    
    // Generate daily time slots (09:00 to 17:00, 30-minute intervals)
    const dailySlots = [];
    for (let h = 9; h <= 17; h++) {
        for (let m of [0, 30]) {
            if (h === 17 && m > 0) continue;
            dailySlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }

    dailySlots.forEach(slot => {
        const [h, m] = slot.split(':');
        const slotDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(h, 10), parseInt(m, 10));

        // Check if date is valid
        if (isNaN(slotDate.getTime())) {
            throw new ApiError(500, 'Error processing time slot dates.');
        }

        const isBlockedByLeave = approvedLeaves.some(leave => {
            try {
                // Leave dates are in YYYY-MM-DD format
                const leaveStart = createDateTimeFromISO(leave.startDate, leave.startTime);
                const leaveEnd = createDateTimeFromISO(leave.endDate, leave.endTime);
                
                return slotDate >= leaveStart && slotDate < leaveEnd;
            } catch (error) {
                console.error('Error parsing leave dates:', error.message);
                return false;
            }
        });

        if (isBlockedByLeave && !bookedTimes.includes(slot)) {
            bookedTimes.push(slot);
        }
    });

    return bookedTimes;
};

/**
 * Create a new appointment
 * @param {number} userId - The authenticated user's ID
 * @param {string} role - The authenticated user's role (PATIENT, CASHIER)
 * @param {object} appointmentData - Appointment data including doctorId, date, time, status, patientId (for CASHIER)
 */
const createAppointment = async (userId, role, appointmentData) => {
    const { doctorId, date, time, status, patientId: patientIdFromBody } = appointmentData;

    if (!role) {
        throw new ApiError(400, 'User role is required.');
    }

    if (!doctorId || !date || !time) {
        throw new ApiError(400, 'Missing required fields.');
    }

    // Validate date and time formats
    if (!validateAppointmentDateFormat(date)) {
        throw new ApiError(400, 'Invalid date format. Expected DD.MM.YYYY (e.g., 25.11.2025).');
    }

    if (!validateTimeFormat(time)) {
        throw new ApiError(400, 'Invalid time format. Expected HH:MM (e.g., 10:00).');
    }

    let patientId;

    // CASHIER must provide patientId - they create appointments for patients
    if (role === 'CASHIER') {
        if (!patientIdFromBody) {
            throw new ApiError(400, 'Patient ID is required for cashier appointments.');
        }
        
        // Verify the patient exists
        const patient = await prisma.patient.findUnique({
            where: { id: parseInt(patientIdFromBody) },
        });
        
        if (!patient) {
            throw new ApiError(404, 'Patient not found.');
        }
        
        patientId = patient.id;
    }
    // PATIENT creates appointment for themselves
    else if (role === 'PATIENT') {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { patient: true },
        });

        if (!user || !user.patient) {
            throw new ApiError(400, 'Patient profile not found.');
        }
        
        patientId = user.patient.id;
    }
    // Other roles cannot create appointments
    else {
        throw new ApiError(403, 'Only patients and cashiers can create appointments.');
    }

    const appointment = await appointmentRepository.createAppointment({
        doctorId,
        patientId,
        date,
        time,
        status: status || 'APPROVED',
    });

    return {
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
    };
};

/**
 * Update appointment status
 */
const updateAppointmentStatus = async (appointmentId, status) => {
    if (!status) {
        throw new ApiError(400, 'Status is required.');
    }

    const appointment = await appointmentRepository.updateAppointmentStatus(appointmentId, status);

    return {
        id: appointment.id,
        status: appointment.status,
    };
};

module.exports = {
    getAppointmentsList,
    getBookedTimesForDoctor,
    createAppointment,
    updateAppointmentStatus,
};
