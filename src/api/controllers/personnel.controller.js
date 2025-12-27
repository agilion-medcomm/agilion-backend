const authService = require('../../services/auth.service');
const personnelService = require('../../services/personnel.service');
const { sendSuccess, sendCreated } = require('../../utils/responseFormatter');
const { parseAndValidateId } = require('../../utils/idValidator');
const { ApiError } = require('../middlewares/errorHandler');
const { ROLES } = require('../../config/constants');

/**
 * GET /api/v1/personnel
 * List all personnel (admin only)
 */
const getPersonnel = async (req, res, next) => {
    try {
        const roleQuery = (req.query && req.query.role) ? req.query.role.toString().toUpperCase() : null;

        // If caller requests a role-specific list
        if (roleQuery) {
            // Only allow doctors and admins to list laborants
            if (roleQuery === ROLES.LABORANT) {
                if (!req.user || (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.DOCTOR)) {
                    return next(new ApiError(403, 'Admin or doctor access required to list laborants.'));
                }
                const list = await personnelService.getPersonnelByRole(ROLES.LABORANT);
                return sendSuccess(res, list);
            }

            // For other role filters require admin
            if (!req.user || req.user.role !== ROLES.ADMIN) {
                return next(new ApiError(403, 'Admin access required.'));
            }
            const list = await personnelService.getPersonnelByRole(roleQuery);
            return sendSuccess(res, list);
        }

        // Full personnel listing requires admin
        if (!req.user || req.user.role !== ROLES.ADMIN) {
            return next(new ApiError(403, 'Admin access required.'));
        }

        const personnel = await personnelService.getAllPersonnel();
        sendSuccess(res, personnel);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/personnel
 * Register new personnel (admin only - enforced by middleware)
 */
const createPersonnel = async (req, res, next) => {
    try {
        // Middleware already verified admin role via authMiddleware + requireAdmin
        const result = await authService.registerPersonnel(req.body);

        sendCreated(res, result.data, result.message);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/personnel/:id
 * Update personnel details
 */
const updatePersonnel = async (req, res, next) => {
    try {
        // Use targetUserId set by requireAdminOrSelf middleware
        const userId = req.targetUserId;

        // Map frontend field names to database schema field names
        const updates = { ...req.body };
        if (updates.bio !== undefined) {
            updates.biography = updates.bio;
            delete updates.bio;
        }
        if (updates.expertise !== undefined) {
            updates.expertiseAreas = updates.expertise;
            delete updates.expertise;
        }
        if (updates.education !== undefined) {
            updates.educationAndAchievements = updates.education;
            delete updates.education;
        }
        if (updates.principles !== undefined) {
            updates.workPrinciples = updates.principles;
            delete updates.principles;
        }

        const user = await personnelService.updatePersonnel(userId, updates);

        sendSuccess(res, user, 'Personnel updated successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/personnel/:id
 * Delete personnel (admin only)
 */
const deletePersonnel = async (req, res, next) => {
    try {
        const id = parseAndValidateId(req.params.id, 'personnel ID');
        const result = await personnelService.deletePersonnel(id);

        sendSuccess(res, result, 'Personnel deleted successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/personnel/:id/photo
 * Upload photo for personnel
 */
const uploadPersonnelPhoto = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid personnel ID.',
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Photo file is required.',
            });
        }

        const photoUrl = `/uploads/personnel-photos/${req.file.filename}`;
        const updatedPersonnel = await personnelService.updatePersonnelPhoto(userId, photoUrl);

        res.json({
            status: 'success',
            message: 'Photo uploaded successfully.',
            data: updatedPersonnel,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/personnel/:id/photo
 * Delete photo for personnel
 */
const deletePersonnelPhoto = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid personnel ID.',
            });
        }

        const updatedPersonnel = await personnelService.updatePersonnelPhoto(userId, null);

        res.json({
            status: 'success',
            message: 'Photo deleted successfully.',
            data: updatedPersonnel,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPersonnel,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    uploadPersonnelPhoto,
    deletePersonnelPhoto,
};
