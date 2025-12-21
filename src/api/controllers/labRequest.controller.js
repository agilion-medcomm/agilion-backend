const labRequestService = require('../../services/labRequest.service');
const { parseAndValidateId } = require('../../utils/idValidator');
const { sendSuccess, sendCreated, sendError } = require('../../utils/responseFormatter');

const createLabRequest = async (req, res, next) => {
    try {
        const payload = {
            patientId: req.body.patientId,
            fileTitle: req.body.fileTitle,
            notes: req.body.notes,
            assigneeLaborantId: req.body.assigneeLaborantId,
        };

        const created = await labRequestService.createLabRequest(req.user.userId, req.user.role, payload);
        sendCreated(res, created, 'Lab request created.');
    } catch (err) {
        next(err);
    }
};

const listLabRequests = async (req, res, next) => {
    try {
        const filters = req.query || {};
        const results = await labRequestService.listLabRequests(req.user.userId, req.user.role, filters);
        sendSuccess(res, results);
    } catch (err) {
        next(err);
    }
};

const getLabRequest = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'request id');
        const result = await labRequestService.getLabRequest(id);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const assignLabRequest = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'request id');
        const assigneeLaborantId = req.body.assigneeLaborantId;
        if (assigneeLaborantId === undefined || assigneeLaborantId === null || assigneeLaborantId === '') {
            return sendError(res, 'assigneeLaborantId is required.', 400);
        }
        const result = await labRequestService.assignLabRequest(id, req.user.userId, assigneeLaborantId);
        sendSuccess(res, result, 'Request assigned.');
    } catch (err) {
        next(err);
    }
};

const claimLabRequest = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'request id');
        if (!req.user.laborantId) return sendError(res, 'Only laborants can claim requests.', 403);
        const result = await labRequestService.claimLabRequest(id, req.user.laborantId);
        sendSuccess(res, result, 'Request claimed.');
    } catch (err) {
        next(err);
    }
};

const confirmLabRequest = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'request id');
        if (!req.user.laborantId) return sendError(res, 'Only laborants can confirm requests.', 403);

        // Expect medicalFileId in body when confirming via API; uploads typically go through /medical-files endpoint
        const { medicalFileId } = req.body;
        if (!medicalFileId) {
            // If no medicalFileId provided, allow idempotent check: if already completed, return success
            const existing = await labRequestService.getLabRequest(id);
            const { REQUEST_STATUS } = require('../../config/constants');
            if (existing.status === REQUEST_STATUS.COMPLETED) {
                return sendSuccess(res, existing, 'Request already completed.');
            }
            return sendError(res, 'medicalFileId is required to confirm the request.', 400);
        }

        const result = await labRequestService.confirmLabRequestWithFile(id, medicalFileId, req.user.laborantId);
        sendSuccess(res, result, 'Request completed.');
    } catch (err) {
        next(err);
    }
};

const cancelLabRequest = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'request id');
        const result = await labRequestService.cancelLabRequest(id, req.user.userId);
        sendSuccess(res, result, 'Request canceled.');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createLabRequest,
    listLabRequests,
    getLabRequest,
    assignLabRequest,
    claimLabRequest,
    confirmLabRequest,
    cancelLabRequest,
};
