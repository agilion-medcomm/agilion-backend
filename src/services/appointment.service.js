const appointmentRepository = require('../repositories/appointment.repository');
const leaveRequestRepository = require('../repositories/leaveRequest.repository');
const doctorRepository = require('../repositories/doctor.repository');
const { ApiError } = require('../api/middlewares/errorHandler');
const prisma = require('../config/db');
const logger = require('../utils/logger');
const { WORKING_HOURS, ROLES, APPOINTMENT_STATUS, RATING } = require('../config/constants');
const {
    parseAppointmentDate,
    validateAppointmentDateFormat,
    validateTimeFormat,
    createDateTimeFromISO,
} = require('../utils/dateTimeValidator');
const { sendAppointmentNotificationEmail, sendAppointmentCancellationEmail } = require('./email.service');

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
        rating: app.rating,
        ratedAt: app.ratedAt,
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
    
    // Generate daily time slots based on working hours configuration
    const dailySlots = [];
    const { START, END, INTERVAL_MINUTES } = WORKING_HOURS;
    
    for (let h = START; h <= END; h++) {
        for (let m = 0; m < 60; m += INTERVAL_MINUTES) {
            if (h === END && m > 0) continue;
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
                logger.error('Error parsing leave dates', error);
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
    if (role === ROLES.CASHIER) {
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
    else if (role === ROLES.PATIENT) {
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
        status: status || APPOINTMENT_STATUS.APPROVED,
    });

    // Send appointment notification email to patient (fire-and-forget)
    // Email is sent asynchronously to not block the API response
    const patientEmail = appointment.patient.user.email;
    const appointmentDetails = {
        patientFirstName: appointment.patient.user.firstName,
        patientLastName: appointment.patient.user.lastName,
        doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        department: appointment.doctor.specialization || '-',
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
    };

    sendAppointmentNotificationEmail(patientEmail, appointmentDetails).catch((error) => {
        // Log error but don't fail the appointment creation
        logger.error('Failed to send appointment notification email', error);
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

    // Send notification email based on status change (fire-and-forget)
    const patientEmail = appointment.patient.user.email;
    const appointmentDetails = {
        patientFirstName: appointment.patient.user.firstName,
        patientLastName: appointment.patient.user.lastName,
        doctorName: `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
        department: appointment.doctor.specialization || '-',
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
    };

    if (status === APPOINTMENT_STATUS.APPROVED) {
        sendAppointmentNotificationEmail(patientEmail, appointmentDetails).catch((error) => {
            logger.error('Failed to send appointment approval email', error);
        });
    } else if (status === APPOINTMENT_STATUS.CANCELED) {
        sendAppointmentCancellationEmail(patientEmail, appointmentDetails).catch((error) => {
            logger.error('Failed to send appointment cancellation email', error);
        });
    }

    return {
        id: appointment.id,
        status: appointment.status,
    };
};

/**
 * Calculate and update doctor's average rating
 * @param {number} doctorId - Doctor ID
 */
const calculateDoctorAverageRating = async (doctorId) => {
    // Get all rated appointments for this doctor
    const ratedAppointments = await appointmentRepository.getRatedAppointmentsForDoctor(doctorId);
    
    if (ratedAppointments.length === 0) {
        // No ratings yet, set to null/0
        await doctorRepository.updateDoctorRatings(doctorId, null, 0);
        return { averageRating: null, totalRatings: 0 };
    }
    
    // Calculate average rating
    const sum = ratedAppointments.reduce((acc, app) => acc + app.rating, 0);
    const average = sum / ratedAppointments.length;
    const averageRating = Math.round(average * 10) / 10; // Round to 1 decimal place
    
    // Update doctor's rating in database
    await doctorRepository.updateDoctorRatings(doctorId, averageRating, ratedAppointments.length);
    
    return { averageRating, totalRatings: ratedAppointments.length };
};

/**
 * Rate an appointment
 * @param {number} appointmentId - Appointment ID
 * @param {number} userId - User ID (must be the patient who owns the appointment)
 * @param {number} rating - Rating value (1-5)
 */
const rateAppointment = async (appointmentId, userId, rating) => {
    // Validate rating value
    if (!rating || typeof rating !== 'number' || !Number.isInteger(rating)) {
        throw new ApiError(400, 'Rating must be an integer.');
    }
    
    if (rating < RATING.MIN || rating > RATING.MAX) {
        throw new ApiError(400, `Rating must be between ${RATING.MIN} and ${RATING.MAX}.`);
    }
    
    // Get appointment with full details
    const appointment = await appointmentRepository.getAppointmentById(appointmentId);
    
    if (!appointment) {
        throw new ApiError(404, 'Randevu bulunamadı.');
    }
    
    // Check if appointment is DONE
    if (appointment.status !== APPOINTMENT_STATUS.DONE) {
        throw new ApiError(400, 'Sadece tamamlanmış randevular değerlendirilebilir.');
    }
    
    // Check if user is the patient who owns this appointment
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { patient: true },
    });
    
    if (!user || !user.patient) {
        throw new ApiError(403, 'Patient profile not found.');
    }
    
    if (appointment.patientId !== user.patient.id) {
        throw new ApiError(403, 'Bu randevuyu sadece randevunun sahibi değerlendirebilir.');
    }
    
    // Check if appointment has already been rated
    if (appointment.rating !== null) {
        throw new ApiError(400, 'Bu randevu zaten değerlendirilmiş.');
    }
    
    // Rate the appointment
    const ratedAppointment = await appointmentRepository.rateAppointment(appointmentId, rating);
    
    // Recalculate doctor's average rating
    await calculateDoctorAverageRating(appointment.doctorId);
    
    logger.info(`Appointment ${appointmentId} rated with ${rating} stars by patient ${user.patient.id}`);
    
    return {
        id: ratedAppointment.id,
        rating: ratedAppointment.rating,
        ratedAt: ratedAppointment.ratedAt,
        status: ratedAppointment.status,
    };
};

module.exports = {
    getAppointmentsList,
    getBookedTimesForDoctor,
    createAppointment,
    updateAppointmentStatus,
    rateAppointment,
    calculateDoctorAverageRating,
};
