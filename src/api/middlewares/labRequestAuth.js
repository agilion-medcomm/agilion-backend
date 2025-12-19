const labRequestRepository = require('../../repositories/labRequest.repository');
const { ApiError } = require('./errorHandler');
const { ROLES } = require('../../config/constants');

/** Ensure the requester is the creator of the lab request or an admin */
const ensureCreatorOrAdmin = async (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new ApiError(400, 'Invalid request id'));

    const reqRow = await labRequestRepository.findRequestById(id);
    if (!reqRow) return next(new ApiError(404, 'Lab request not found'));

    if (req.user.role === ROLES.ADMIN) return next();

    if (reqRow.createdByUserId !== req.user.userId) {
        return next(new ApiError(403, 'Only the creator or admin can perform this action'));
    }

    next();
};

/** Ensure the caller is a laborant and either assigned to the request or the request is claimable (PENDING) */
const ensureLaborantAssignedOrClaimable = async (req, res, next) => {
    if (!req.user.laborantId) return next(new ApiError(403, 'Only laborants can perform this action'));
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new ApiError(400, 'Invalid request id'));

    const reqRow = await labRequestRepository.findRequestById(id);
    if (!reqRow) return next(new ApiError(404, 'Lab request not found'));

    const { REQUEST_STATUS } = require('../../config/constants');
    // If already completed or canceled, block
    if (reqRow.status === REQUEST_STATUS.COMPLETED || reqRow.status === REQUEST_STATUS.CANCELED) return next(new ApiError(400, 'Request cannot be modified'));

    // If assigned to someone else, deny
    if (reqRow.assigneeLaborantId && reqRow.assigneeLaborantId !== req.user.laborantId) {
        return next(new ApiError(403, 'Request assigned to another laborant'));
    }

    // Otherwise allow (either PENDING/unassigned or assigned to this laborant)
    next();
};

module.exports = {
    ensureCreatorOrAdmin,
    ensureLaborantAssignedOrClaimable,
};
