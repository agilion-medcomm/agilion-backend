const leaveRequestRepository = require('../repositories/leaveRequest.repository');
const { ApiError } = require('../api/middlewares/errorHandler');
const prisma = require('../config/db');
const { validateISODateFormat, validateTimeFormat } = require('../utils/dateTimeValidator');

/**
 * Get leave requests (all for admin, own for doctor)
 */
const getLeaveRequests = async (userRole, userId) => {
    const filters = {};
    
    // Only ADMIN and DOCTOR roles can access leave requests
    if (userRole === 'DOCTOR') {
        // Doctors can only see their own requests
        const doctor = await prisma.doctor.findUnique({
            where: { userId },
        });
        if (!doctor) {
            throw new ApiError(404, 'Doctor profile not found.');
        }
        filters.doctorId = doctor.id;
    } else if (userRole !== 'ADMIN') {
        // Reject access for any other role (e.g., PATIENT)
        throw new ApiError(403, 'Access denied. Only doctors and admins can view leave requests.');
    }

    const requests = await leaveRequestRepository.getLeaveRequests(filters);
    
    // Map to frontend format
    return requests.map(leaveReq => ({
        id: leaveReq.id,
        personnelId: leaveReq.doctorId,
        personnelFirstName: leaveReq.doctor.user.firstName,
        personnelLastName: leaveReq.doctor.user.lastName,
        personnelRole: leaveReq.doctor.user.role,
        startDate: leaveReq.startDate,
        startTime: leaveReq.startTime,
        endDate: leaveReq.endDate,
        endTime: leaveReq.endTime,
        reason: leaveReq.reason,
        status: leaveReq.status,
        requestedAt: leaveReq.requestedAt,
        resolvedAt: leaveReq.resolvedAt,
    }));
};

/**
 * Create a new leave request
 */
const createLeaveRequest = async (leaveData) => {
    const { personnelId, startDate, startTime, endDate, endTime, reason } = leaveData;

    if (!personnelId || !startDate || !startTime || !endDate || !endTime || !reason) {
        throw new ApiError(400, 'Missing required fields.');
    }

    // Validate date and time formats
    if (!validateISODateFormat(startDate)) {
        throw new ApiError(400, 'Invalid start date format. Expected YYYY-MM-DD (e.g., 2025-11-25).');
    }
    if (!validateISODateFormat(endDate)) {
        throw new ApiError(400, 'Invalid end date format. Expected YYYY-MM-DD (e.g., 2025-11-25).');
    }
    if (!validateTimeFormat(startTime)) {
        throw new ApiError(400, 'Invalid start time format. Expected HH:MM (e.g., 09:00).');
    }
    if (!validateTimeFormat(endTime)) {
        throw new ApiError(400, 'Invalid end time format. Expected HH:MM (e.g., 18:00).');
    }

    const leaveRequest = await leaveRequestRepository.createLeaveRequest({
        doctorId: personnelId,
        startDate,
        startTime,
        endDate,
        endTime,
        reason,
    });

    return {
        id: leaveRequest.id,
        personnelId: leaveRequest.doctorId,
        status: leaveRequest.status,
    };
};

/**
 * Update leave request status (admin only)
 */
const updateLeaveRequestStatus = async (requestId, status) => {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
        throw new ApiError(400, 'Invalid status. Must be APPROVED or REJECTED.');
    }

    const leaveRequest = await leaveRequestRepository.updateLeaveRequestStatus(requestId, status);

    return {
        id: leaveRequest.id,
        status: leaveRequest.status,
        resolvedAt: leaveRequest.resolvedAt,
    };
};

module.exports = {
    getLeaveRequests,
    createLeaveRequest,
    updateLeaveRequestStatus,
};
