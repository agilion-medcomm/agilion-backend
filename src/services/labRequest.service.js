const labRequestRepository = require('../repositories/labRequest.repository');
const prisma = require('../config/db');
const { ApiError } = require('../api/middlewares/errorHandler');
const logger = require('../utils/logger');
const { validateRequiredFields } = require('../utils/validators');
const { REQUEST_STATUS } = require('../config/constants');
const userRepository = require('../repositories/user.repository');

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

    const created = await labRequestRepository.createRequest(payload);
    logger.info(`Lab request ${created.id} created by user ${userId}`);
    return created;
};

const listLabRequests = async (userId, role, filters) => {
    // Adjust filters based on role
    const f = { ...(filters || {}) };

    if (role === 'LABORANT') {
        // Laborant sees assigned requests and optionally open ones (front-end can request status=PENDING)
        // If not filtering by assignedLaborantId explicitly, default to their assigned ones
        if (!f.assignedLaborantId && !f.status) {
            const laborant = await prisma.laborant.findUnique({ where: { userId: parseInt(userId) } });
            if (laborant) f.assignedLaborantId = laborant.id;
        }
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
    // Verify assignee exists
    const laborant = await prisma.laborant.findUnique({ where: { id: parseInt(assigneeLaborantId) } });
    if (!laborant) throw new ApiError(404, 'Laborant not found');

    const updated = await labRequestRepository.assignToLaborant(requestId, assigneeLaborantId);
    logger.info(`Lab request ${requestId} assigned to laborant ${assigneeLaborantId} by user ${assignerUserId}`);
    return updated;
};

const claimLabRequest = async (requestId, laborantId) => {
    try {
        const updated = await labRequestRepository.claimRequest(requestId, laborantId);
        logger.info(`Lab request ${requestId} claimed by laborant ${laborantId}`);
        return updated;
    } catch (err) {
        throw new ApiError(400, err.message || 'Unable to claim request');
    }
};

const confirmLabRequestWithFile = async (requestId, medicalFileId, laborantId) => {
    // Verify request exists and assigned to this laborant (or assign if unassigned)
    const req = await labRequestRepository.findRequestById(requestId);
    if (!req) throw new ApiError(404, 'Lab request not found');
    const { REQUEST_STATUS } = require('../config/constants');
    if (req.status === REQUEST_STATUS.CANCELED) throw new ApiError(400, 'Request is canceled');
    if (req.status === REQUEST_STATUS.COMPLETED) throw new ApiError(400, 'Request already completed');

    // If unassigned, only allow the laborant to confirm if they claim it first
    if (!req.assigneeLaborantId) {
        // attempt to claim
        await labRequestRepository.claimRequest(requestId, laborantId);
    } else if (req.assigneeLaborantId !== laborantId) {
        throw new ApiError(403, 'You are not the assigned laborant for this request');
    }

    // Attach medical file and mark request completed
    const result = await labRequestRepository.attachMedicalFile(requestId, medicalFileId);
    logger.info(`Lab request ${requestId} completed by laborant ${laborantId} with medicalFile ${medicalFileId}`);
    return result;
};

const cancelLabRequest = async (requestId, userId) => {
    const req = await labRequestRepository.findRequestById(requestId);
    if (!req) throw new ApiError(404, 'Lab request not found');
    const { REQUEST_STATUS } = require('../config/constants');
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
