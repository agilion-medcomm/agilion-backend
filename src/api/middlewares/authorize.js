
const { ApiError } = require('./errorHandler');

/**
 * Authorization Middleware (Role-Based Access Control)
 * Checks if user has one of the allowed roles
 * Must be used after authMiddleware
 * Returns 403 if user doesn't have required role
 * 
 * Usage: authorize('ADMIN', 'DOCTOR')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError(403, 'You are not authorized to perform this action'));
        }
        next();
    };
};

module.exports = authorize;