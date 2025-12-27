const prisma = require('../../config/db');
const { ROLES } = require('../../config/constants');
const { ApiError } = require('./errorHandler');
const logger = require('../../utils/logger');

/**
 * Middleware to allow admin OR the user updating their own profile
 * Accepts user ID from frontend and checks authorization
 * 
 * Must be used after authMiddleware
 */
const requireAdminOrSelf = async (req, res, next) => {
    const { id } = req.params; // This is a user ID from frontend
    const requestingUser = req.user; // From JWT: { userId, role, tckn, doctorId?, adminId?, laborantId?, cleanerId? }

    try {
        const targetUserId = parseInt(id);

        if (isNaN(targetUserId)) {
            return next(new ApiError(400, 'Invalid user ID.'));
        }

        // Verify the target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, role: true }
        });

        if (!targetUser) {
            return next(new ApiError(404, 'Personnel not found.'));
        }

        // Attach the target user ID to the request for the controller to use
        req.targetUserId = targetUserId;

        // Allow if admin
        if (requestingUser.role === ROLES.ADMIN) {
            return next();
        }

        // Allow if user is updating their own profile
        if (requestingUser.userId === targetUserId) {
            return next();
        }

        return next(new ApiError(403, 'You can only update your own profile.'));

    } catch (error) {
        logger.error('Error in requireAdminOrSelf', error);
        return next(new ApiError(500, 'Error verifying user identity.'));
    }
};

module.exports = requireAdminOrSelf;
