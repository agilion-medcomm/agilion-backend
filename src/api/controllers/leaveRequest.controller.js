const leaveRequestService = require('../../services/leaveRequest.service');
const { sendSuccess, sendCreated } = require('../../utils/responseFormatter');

/**
 * GET /api/v1/leave-requests
 * Get all leave requests (admin) or doctor's own requests
 */
const getLeaveRequests = async (req, res, next) => {
    try {
        const requests = await leaveRequestService.getLeaveRequests(req.user.role, req.user.userId);
        sendSuccess(res, requests);
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

        sendCreated(res, leaveRequest, 'Leave request submitted successfully.');
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

        sendSuccess(res, leaveRequest, `Leave request ${status.toLowerCase()}.`);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLeaveRequests,
    createLeaveRequest,
    updateLeaveRequestStatus,
};
