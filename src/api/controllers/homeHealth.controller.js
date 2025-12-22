const homeHealthService = require('../../services/homeHealth.service');
const { sendSuccess, sendCreated } = require('../../utils/responseFormatter');
const { parseAndValidateId } = require('../../utils/idValidator');

/**
 * POST /api/v1/home-health
 * Create a new home health request
 * Accessible by all authenticated users
 */
const createRequest = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await homeHealthService.createRequest(userId, req.body);

        sendCreated(res, result, 'Home health request created successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/home-health
 * Get all home health requests with optional status filter
 * Accessible by Admin and Cashier
 */
const getAllRequests = async (req, res, next) => {
    try {
        const { status } = req.query;
        
        const filters = {};
        if (status) {
            filters.status = status;
        }

        const requests = await homeHealthService.getAllRequests(filters);
        sendSuccess(res, { requests });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/home-health/:id
 * Get a single home health request by ID
 * Accessible by Admin and Cashier
 */
const getRequestById = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'home health request ID');
        const request = await homeHealthService.getRequestById(id);

        sendSuccess(res, { request });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/home-health/:id/approve
 * Approve a home health request
 * Accessible by Admin and Cashier
 */
const approve = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'home health request ID');
        const userId = req.user.userId;
        const { approvalNote } = req.body;

        const result = await homeHealthService.approveRequest(id, userId, approvalNote);
        sendSuccess(res, result, 'Home health request approved successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/home-health/:id/reject
 * Reject a home health request
 * Accessible by Admin and Cashier
 */
const reject = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'home health request ID');
        const userId = req.user.userId;
        const { approvalNote } = req.body;

        const result = await homeHealthService.rejectRequest(id, userId, approvalNote);
        sendSuccess(res, result, 'Home health request rejected successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/home-health/stats
 * Get statistics for home health requests
 * Accessible by Admin and Cashier
 */
const getStats = async (req, res, next) => {
    try {
        const stats = await homeHealthService.getStats();
        sendSuccess(res, stats);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRequest,
    getAllRequests,
    getRequestById,
    approve,
    reject,
    getStats,
};

