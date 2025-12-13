const { ApiError } = require('./errorHandler');
const { ROLES } = require('../../config/constants');

/**
 * Middleware to require ADMIN role
 * Must be used after authMiddleware
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
        return next(new ApiError(403, 'Admin access required.'));
    }
    next();
};

module.exports = requireAdmin;
