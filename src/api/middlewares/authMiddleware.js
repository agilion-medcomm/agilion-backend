const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches decoded user to req.user
 * Returns 401 if token is missing, invalid, or expired
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'No token provided.');
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // { userId, role, tckn }
            next();
        } catch (jwtError) {
            throw new ApiError(401, 'Invalid or expired token.');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = authMiddleware;
