const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

/**
 * Middleware to extract and verify JWT from Authorization header
 * Attaches decoded user info to req.user
 */
const authMiddleware = async (req, res, next) => {
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

const authorize = (...roles) => {
    return (req, res, next) => {

        if (!req.user || !roles.includes(req.user.role)) {

            return next(new ApiError(401, 'You are not authorized to perform this action'));
        }
        next();
    };
};

module.exports = {
    authMiddleware,
    authorize
};
