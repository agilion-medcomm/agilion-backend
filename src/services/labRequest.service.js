const labRequestRepository = require('../repositories/labRequest.repository');
const prisma = require('../config/db');
const { ApiError } = require('../api/middlewares/errorHandler');
const logger = require('../utils/logger');
const { validateRequiredFields } = require('../utils/validators');
const { ROLES } = require('../config/constants');

/**
 * Create a new lab request
 * @param {number} userId - creator user id
 * @param {string} role - creator role
 * @param {object} data - { patientId, fileTitle, notes, assigneeLaborantId }
 */
const createLabRequest = async (userId, role, data) => {
    validateRequiredFields(data, ['patientId', 'fileTitle']);

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id: parseInt(data.patientId) } });
    if (!patient) throw new ApiError(404, 'Patient not found');

    // Ensure creator exists
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) throw new ApiError(401, 'Creator user not found');

    const payload = {
        patientId: parseInt(data.patientId),
        createdByUserId: parseInt(userId),
        assigneeLaborantId: data.assigneeLaborantId ? parseInt(data.assigneeLaborantId) : null,
        fileTitle: data.fileTitle,
        notes: data.notes || null,
        // status set in repository based on assignee presence
    };

    // If assigneeLaborantId provided, verify and normalize it.
    if (payload.assigneeLaborantId) {
        // Try to find a laborant by id first
        const assigneeId = payload.assigneeLaborantId;
        let laborant = await prisma.laborant.findUnique({ where: { id: assigneeId } });
        if (!laborant) {
            // Maybe the frontend sent a personnel user id instead of laborant id — try by userId
            laborant = await prisma.laborant.findUnique({ where: { userId: assigneeId } });
        }
        if (!laborant) {
            throw new ApiError(404, 'Laborant not found for assigneeLaborantId');
        }
        payload.assigneeLaborantId = laborant.id;
    }

    try {
        const created = await labRequestRepository.createRequest(payload);
        logger.info(`Lab request ${created.id} created by user ${userId}`);
        return created;
    } catch (err) {
        // Map common Prisma errors to ApiError for consistent HTTP responses
        if (err.code === 'P2003') {
            // Foreign key constraint failed
            throw new ApiError(400, 'Invalid reference provided for lab request (foreign key constraint)');
        }
        throw err;
    }
};

const listLabRequests = async (userId, role, filters) => {
    // Adjust filters based on role
    const f = { ...(filters || {}) };

    if (role === ROLES.LABORANT) {
        // Laborant sees assigned requests and optionally open ones (front-end can request status=PENDING)
        // If not filtering by assigneeLaborantId explicitly, default to their assigned ones
        if (!f.assigneeLaborantId && !f.status) {
            const laborant = await prisma.laborant.findUnique({ where: { userId: parseInt(userId) } });
            if (laborant) f.assigneeLaborantId = laborant.id;
        }
    }

    if (role === ROLES.PATIENT) {
        // Patients can only see their own requests
        const patient = await prisma.patient.findUnique({ where: { userId: parseInt(userId) } });
        if (!patient) return []; // Should not happen if data integrity is maintained
        f.patientId = patient.id;
    }

    // DOCTOR and ADMIN see all requests by default; front-end can filter further
    const results = await labRequestRepository.findRequests(f);
    return results;
};

const getLabRequest = async (id) => {
    const req = await labRequestRepository.findRequestById(id);
    if (!req) throw new ApiError(404, 'Lab request not found');
    return req;
};

const assignLabRequest = async (requestId, assignerUserId, assigneeLaborantId) => {
    try {
        // Verify assignee exists; accept either laborant.id or personnel userId
        if (!assigneeLaborantId) throw new ApiError(400, 'assigneeLaborantId is required');
        const parsed = parseInt(assigneeLaborantId);
        let laborant = null;
        if (!isNaN(parsed)) {
            laborant = await prisma.laborant.findUnique({ where: { id: parsed } });
        }
        if (!laborant) {
            // try by userId (frontend might send personnel user id)
            laborant = await prisma.laborant.findUnique({ where: { userId: parsed } });
        }
        if (!laborant) throw new ApiError(404, 'Laborant not found');

        const updated = await labRequestRepository.assignToLaborant(requestId, laborant.id);
        logger.info(`Lab request ${requestId} assigned to laborant ${laborant.id} by user ${assignerUserId}`);
        return updated;
    } catch (err) {
        if (err instanceof ApiError) throw err;
        if (err && err.code === 'P2025') {
            throw new ApiError(404, 'Lab request not found');
        }
        if (err && err.code === 'P2003') {
            throw new ApiError(400, 'Invalid reference provided when assigning lab request');
        }
        throw new ApiError(400, err.message || 'Failed to assign lab request');
    }
};

const claimLabRequest = async (requestId, laborantId) => {
    try {
        const updated = await labRequestRepository.claimRequest(requestId, laborantId);
        logger.info(`Lab request ${requestId} claimed by laborant ${laborantId}`);
        return updated;
    } catch (err) {
        if (err instanceof ApiError) throw err;
        if (err && err.code === 'P2025') {
            throw new ApiError(404, 'Lab request not found');
        }
        throw new ApiError(400, err.message || 'Unable to claim request');
    }
};

const confirmLabRequestWithFile = async (requestId, medicalFileId, laborantId) => {
    // Verify request exists and assigned to this laborant (or assign if unassigned)
    const req = await labRequestRepository.findRequestById(requestId);
    if (!req) throw new ApiError(404, 'Lab request not found');
    if (req.status === REQUEST_STATUS.CANCELED) throw new ApiError(400, 'Request is canceled');
    // If already completed, allow idempotent confirm when same file is provided
    if (req.status === REQUEST_STATUS.COMPLETED) {
        if (req.medicalFileId && req.medicalFileId === parseInt(medicalFileId)) {
            return req; // idempotent success
        }
        throw new ApiError(400, 'Request already completed with another medical file');
    }

    // If unassigned, only allow the laborant to confirm if they claim it first
    if (!req.assigneeLaborantId) {
        // attempt to claim
        await labRequestRepository.claimRequest(requestId, laborantId);
    } else if (req.assigneeLaborantId !== laborantId) {
        throw new ApiError(403, 'You are not the assigned laborant for this request');
    }

    // Attach medical file and mark request completed
    try {
        const result = await labRequestRepository.attachMedicalFile(requestId, medicalFileId);
        logger.info(`Lab request ${requestId} completed by laborant ${laborantId} with medicalFile ${medicalFileId}`);
        return result;
    } catch (err) {
        // Propagate ApiError from repository, map others to 400
        if (err instanceof ApiError) throw err;
        throw new ApiError(400, err.message || 'Unable to attach medical file to request');
    }
};

const cancelLabRequest = async (requestId, userId) => {
    const req = await labRequestRepository.findRequestById(requestId);
    if (!req) throw new ApiError(404, 'Lab request not found');
    if (req.status === REQUEST_STATUS.COMPLETED) throw new ApiError(400, 'Cannot cancel a completed request');

    const updated = await labRequestRepository.cancelRequest(requestId);
    logger.info(`Lab request ${requestId} canceled by user ${userId}`);
    return updated;
};

module.exports = {
    createLabRequest,
    listLabRequests,
    getLabRequest,
    assignLabRequest,
    claimLabRequest,
    confirmLabRequestWithFile,
    cancelLabRequest,
};
