const prisma = require('../config/db.js');

/**
 * Creates a new appointment
 */
const createAppointment = async (data) => {
    return prisma.appointment.create({
        data: {
            patientId: data.patientId,
            doctorId: data.doctorId,
            date: data.date,
            time: data.time,
            status: data.status || 'APPROVED',
        },
        include: {
            patient: { include: { user: true } },
            doctor: { include: { user: true } },
        },
    });
};

/**
 * Get appointments with filters
 */
const getAppointments = async (filters = {}) => {
    const where = {};
    
    if (filters.doctorId) {
        where.doctorId = parseInt(filters.doctorId);
    }
    
    if (filters.patientId) {
        where.patientId = parseInt(filters.patientId);
    }
    
    if (filters.date) {
        where.date = filters.date;
    }
    
    if (filters.status) {
        where.status = filters.status;
    }

    return prisma.appointment.findMany({
        where,
        include: {
            patient: { include: { user: true } },
            doctor: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Update appointment status
 */
const updateAppointmentStatus = async (id, status) => {
    return prisma.appointment.update({
        where: { id: parseInt(id) },
        data: { status },
    });
};

/**
 * Get booked times for a doctor on a specific date
 */
const getBookedTimes = async (doctorId, date) => {
    const appointments = await prisma.appointment.findMany({
        where: {
            doctorId: parseInt(doctorId),
            date,
            status: { not: 'CANCELLED' },
        },
        select: { time: true },
    });
    
    return appointments.map(a => a.time);
};

module.exports = {
    createAppointment,
    getAppointments,
    updateAppointmentStatus,
    getBookedTimes,
};
