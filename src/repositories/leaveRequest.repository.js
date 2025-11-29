const prisma = require('../config/db.js');

/**
 * Create a new leave request
 */
const createLeaveRequest = async (data) => {
    return prisma.leaveRequest.create({
        data: {
            doctorId: data.doctorId,
            startDate: data.startDate,
            startTime: data.startTime,
            endDate: data.endDate,
            endTime: data.endTime,
            reason: data.reason,
            status: 'PENDING',
        },
        include: {
            doctor: { include: { user: true } },
        },
    });
};

/**
 * Get all leave requests or filter by doctor/status
 */
const getLeaveRequests = async (filters = {}) => {
    const where = {};
    
    if (filters.doctorId) {
        where.doctorId = parseInt(filters.doctorId);
    }
    
    if (filters.status) {
        where.status = filters.status;
    }

    return prisma.leaveRequest.findMany({
        where,
        include: {
            doctor: { include: { user: true } },
        },
        orderBy: { requestedAt: 'desc' },
    });
};

/**
 * Update leave request status
 */
const updateLeaveRequestStatus = async (id, status) => {
    return prisma.leaveRequest.update({
        where: { id: parseInt(id) },
        data: {
            status,
            resolvedAt: new Date(),
        },
        include: {
            doctor: { include: { user: true } },
        },
    });
};

/**
 * Get approved leave requests for a doctor
 */
const getApprovedLeaves = async (doctorId) => {
    return prisma.leaveRequest.findMany({
        where: {
            doctorId: parseInt(doctorId),
            status: 'APPROVED',
        },
    });
};

module.exports = {
    createLeaveRequest,
    getLeaveRequests,
    updateLeaveRequestStatus,
    getApprovedLeaves,
};
