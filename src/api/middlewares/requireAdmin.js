const { ApiError } = require('./errorHandler');

/**
 * Middleware to require ADMIN role
 * Must be used after authMiddleware
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return next(new ApiError(403, 'Admin access required.'));
    }
    next();
};

module.exports = requireAdmin;
