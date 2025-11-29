const jwt = require('jsonwebtoken');
const userRepository = require('../../repositories/user.repository');
const { ApiError } = require('./errorHandler');

/**
 * Alternative authentication middleware
 * Express middleware to verify JWT and attach user to request
 * Uses findUserById from repository
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'Authorization token missing');
        }

        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload || !payload.userId) {
            throw new ApiError(401, 'Invalid token');
        }

        const user = await userRepository.findUserById(payload.userId);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Remove sensitive fields
        delete user.password;
        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = authenticate;
