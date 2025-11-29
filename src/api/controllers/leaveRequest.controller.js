const leaveRequestRepository = require('../../repositories/leaveRequest.repository');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * GET /api/v1/leave-requests
 * Get all leave requests (admin) or doctor's own requests
 */
const getLeaveRequests = async (req, res, next) => {
    try {
        const filters = {};
        
        // If not admin, only show own requests
        if (req.user.role !== 'ADMIN' && req.user.role === 'DOCTOR') {
            // Find doctor ID from userId
            const prisma = require('../../config/db');
            const doctor = await prisma.doctor.findUnique({
                where: { userId: req.user.userId },
            });
            if (doctor) {
                filters.doctorId = doctor.id;
            }
        }

        const requests = await leaveRequestRepository.getLeaveRequests(filters);
        
        // Map to frontend format
        const formatted = requests.map(req => ({
            id: req.id,
            personnelId: req.doctorId,
            personnelFirstName: req.doctor.user.firstName,
            personnelLastName: req.doctor.user.lastName,
            personnelRole: req.doctor.user.role,
            startDate: req.startDate,
            startTime: req.startTime,
            endDate: req.endDate,
            endTime: req.endTime,
            reason: req.reason,
            status: req.status,
            requestedAt: req.requestedAt,
            resolvedAt: req.resolvedAt,
        }));

        res.json({ status: 'success', data: formatted });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/leave-requests
 * Create a new leave request (doctor only)
 */
const createLeaveRequest = async (req, res, next) => {
    try {
        const { personnelId, startDate, startTime, endDate, endTime, reason } = req.body;

        if (!personnelId || !startDate || !startTime || !endDate || !endTime || !reason) {
            throw new ApiError(400, 'Missing required fields.');
        }

        const leaveRequest = await leaveRequestRepository.createLeaveRequest({
            doctorId: personnelId,
            startDate,
            startTime,
            endDate,
            endTime,
            reason,
        });

        res.status(201).json({
            status: 'success',
            message: 'Leave request submitted successfully.',
            data: {
                id: leaveRequest.id,
                personnelId: leaveRequest.doctorId,
                status: leaveRequest.status,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/leave-requests/:id/status
 * Update leave request status (admin only)
 */
const updateLeaveRequestStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            throw new ApiError(400, 'Invalid status. Must be APPROVED or REJECTED.');
        }

        const leaveRequest = await leaveRequestRepository.updateLeaveRequestStatus(id, status);

        res.json({
            status: 'success',
            message: `Leave request ${status.toLowerCase()}.`,
            data: {
                id: leaveRequest.id,
                status: leaveRequest.status,
                resolvedAt: leaveRequest.resolvedAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLeaveRequests,
    createLeaveRequest,
    updateLeaveRequestStatus,
};
