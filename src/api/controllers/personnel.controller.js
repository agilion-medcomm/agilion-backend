const authService = require('../../services/auth.service');
const personnelService = require('../../services/personnel.service');
const { sendSuccess, sendCreated } = require('../../utils/responseFormatter');

/**
 * GET /api/v1/personnel
 * List all personnel (admin only)
 */
const getPersonnel = async (req, res, next) => {
    try {
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
        
        res.status(201).json({
            status: result.status,
            message: result.message,
            data: result.data,
        });
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
        const user = await personnelService.updatePersonnel(userId, req.body);

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
        const { id } = req.params;
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
