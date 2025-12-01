const authMiddleware = require('./authMiddleware');

/**
 * Optional authentication middleware
 * Applies authMiddleware only if Authorization header is present
 * Otherwise, allows the request to continue without authentication
 * 
 * Useful for endpoints that can work both with and without authentication
 * (e.g., public appointment slot checking vs authenticated appointment lists)
 */
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
        // Token present, apply authentication
        return authMiddleware(req, res, next);
    }
    
    // No token, continue without authentication
    next();
};

module.exports = optionalAuth;
