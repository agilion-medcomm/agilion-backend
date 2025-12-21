const prisma = require('../config/db');
const { ApiError } = require('../api/middlewares/errorHandler');
const { validateISODateFormat, validateTimeFormat, isoDateToObject } = require('../utils/dateTimeValidator');

/**
 * Home Health Service
 * Business logic for home healthcare service requests
 */

/**
 * Create a new home health request
 * @param {number} userId - User ID from JWT token
 * @param {Object} requestData - Request data from body
 * @returns {Object} - Created request with id and status
 */
const createRequest = async (userId, requestData) => {
    const {
        fullName,
        tckn,
        phoneNumber,
        email,
        address,
        serviceType,
        serviceDetails,
        preferredDate,
        preferredTime,
        notes,
    } = requestData;

    // Validate date format
    if (!validateISODateFormat(preferredDate)) {
        throw new ApiError(400, 'Invalid preferred date format. Expected YYYY-MM-DD (e.g., 2025-11-25).');
    }

    // Validate time format if provided
    if (preferredTime && !validateTimeFormat(preferredTime)) {
        throw new ApiError(400, 'Invalid preferred time format. Expected HH:MM (e.g., 14:30).');
    }

    // Validate that preferred date is today or in the future
    const preferredDateObj = isoDateToObject(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (preferredDateObj < today) {
        throw new ApiError(400, 'Preferred date must be today or a future date.');
    }

    const homeHealthRequest = await prisma.homeHealthRequest.create({
        data: {
            userId,
            fullName,
            tckn,
            phoneNumber,
            email: email || null,
            address,
            serviceType,
            serviceDetails: serviceDetails || null,
            preferredDate: preferredDateObj,
            preferredTime: preferredTime || null,
            notes: notes || null,
        },
    });

    return {
        id: homeHealthRequest.id,
        status: homeHealthRequest.status,
        createdAt: homeHealthRequest.createdAt,
    };
};

/**
 * Get all home health requests with optional status filter
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Optional status filter (PENDING, APPROVED, REJECTED)
 * @returns {Array} - Array of home health requests
 */
const getAllRequests = async (filters = {}) => {
    const whereClause = {};

    if (filters.status) {
        whereClause.status = filters.status;
    }

    const requests = await prisma.homeHealthRequest.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return requests.map((request) => ({
        id: request.id,
        userId: request.userId,
        userFirstName: request.user.firstName,
        userLastName: request.user.lastName,
        userEmail: request.user.email,
        userRole: request.user.role,
        fullName: request.fullName,
        tckn: request.tckn,
        phoneNumber: request.phoneNumber,
        email: request.email,
        address: request.address,
        serviceType: request.serviceType,
        serviceDetails: request.serviceDetails,
        preferredDate: request.preferredDate,
        preferredTime: request.preferredTime,
        notes: request.notes,
        status: request.status,
        approvedBy: request.approvedBy,
        approvedAt: request.approvedAt,
        approvalNote: request.approvalNote,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
    }));
};

/**
 * Get a single home health request by ID
 * @param {number} id - Request ID
 * @returns {Object} - Home health request details
 * @throws {ApiError} - If request not found
 */
const getRequestById = async (id) => {
    const request = await prisma.homeHealthRequest.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    if (!request) {
        throw new ApiError(404, 'Home health request not found.');
    }

    return {
        id: request.id,
        userId: request.userId,
        userFirstName: request.user.firstName,
        userLastName: request.user.lastName,
        userEmail: request.user.email,
        userRole: request.user.role,
        fullName: request.fullName,
        tckn: request.tckn,
        phoneNumber: request.phoneNumber,
        email: request.email,
        address: request.address,
        serviceType: request.serviceType,
        serviceDetails: request.serviceDetails,
        preferredDate: request.preferredDate,
        preferredTime: request.preferredTime,
        notes: request.notes,
        status: request.status,
        approvedBy: request.approvedBy,
        approvedAt: request.approvedAt,
        approvalNote: request.approvalNote,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
    };
};

/**
 * Approve a home health request
 * @param {number} id - Request ID
 * @param {number} approvedByUserId - Admin/Cashier user ID
 * @param {string} approvalNote - Optional approval note
 * @returns {Object} - Updated request
 * @throws {ApiError} - If request not found or already processed
 */
const approveRequest = async (id, approvedByUserId, approvalNote = null) => {
    // Check if request exists
    const existingRequest = await prisma.homeHealthRequest.findUnique({
        where: { id },
    });

    if (!existingRequest) {
        throw new ApiError(404, 'Home health request not found.');
    }

    if (existingRequest.status !== 'PENDING') {
        throw new ApiError(400, 'Only pending requests can be approved.');
    }

    // Update request status
    const updatedRequest = await prisma.homeHealthRequest.update({
        where: { id },
        data: {
            status: 'APPROVED',
            approvedBy: approvedByUserId,
            approvedAt: new Date(),
            approvalNote: approvalNote || null,
        },
    });

    return {
        id: updatedRequest.id,
        status: updatedRequest.status,
        approvedBy: updatedRequest.approvedBy,
        approvedAt: updatedRequest.approvedAt,
        approvalNote: updatedRequest.approvalNote,
    };
};

/**
 * Reject a home health request
 * @param {number} id - Request ID
 * @param {number} approvedByUserId - Admin/Cashier user ID
 * @param {string} approvalNote - Optional rejection note
 * @returns {Object} - Updated request
 * @throws {ApiError} - If request not found or already processed
 */
const rejectRequest = async (id, approvedByUserId, approvalNote = null) => {
    // Check if request exists
    const existingRequest = await prisma.homeHealthRequest.findUnique({
        where: { id },
    });

    if (!existingRequest) {
        throw new ApiError(404, 'Home health request not found.');
    }

    if (existingRequest.status !== 'PENDING') {
        throw new ApiError(400, 'Only pending requests can be rejected.');
    }

    // Update request status
    const updatedRequest = await prisma.homeHealthRequest.update({
        where: { id },
        data: {
            status: 'REJECTED',
            approvedBy: approvedByUserId,
            approvedAt: new Date(),
            approvalNote: approvalNote || null,
        },
    });

    return {
        id: updatedRequest.id,
        status: updatedRequest.status,
        approvedBy: updatedRequest.approvedBy,
        approvedAt: updatedRequest.approvedAt,
        approvalNote: updatedRequest.approvalNote,
    };
};

/**
 * Get statistics for home health requests
 * @returns {Object} - Statistics object with counts
 */
const getStats = async () => {
    const [pending, approved, rejected, total] = await Promise.all([
        prisma.homeHealthRequest.count({ where: { status: 'PENDING' } }),
        prisma.homeHealthRequest.count({ where: { status: 'APPROVED' } }),
        prisma.homeHealthRequest.count({ where: { status: 'REJECTED' } }),
        prisma.homeHealthRequest.count(),
    ]);

    return {
        pending,
        approved,
        rejected,
        total,
    };
};

module.exports = {
    createRequest,
    getAllRequests,
    getRequestById,
    approveRequest,
    rejectRequest,
    getStats,
};

