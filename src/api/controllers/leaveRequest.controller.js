const leaveRequestService = require('../../services/leaveRequest.service');

/**
 * GET /api/v1/leave-requests
 * Get all leave requests (admin) or doctor's own requests
 */
const getLeaveRequests = async (req, res, next) => {
    try {
        const requests = await leaveRequestService.getLeaveRequests(req.user.role, req.user.userId);
        res.json({ status: 'success', data: requests });
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
        const leaveRequest = await leaveRequestService.createLeaveRequest(req.body);

        res.status(201).json({
            status: 'success',
            message: 'Leave request submitted successfully.',
            data: leaveRequest,
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

        const leaveRequest = await leaveRequestService.updateLeaveRequestStatus(id, status);

        res.json({
            status: 'success',
            message: `Leave request ${status.toLowerCase()}.`,
            data: leaveRequest,
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
