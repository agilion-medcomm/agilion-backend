
const { ApiError } = require('./errorHandler');

const authorize = (...roles) => {
    return (req, res, next) => {

        if (!req.user || !roles.includes(req.user.role)) {

            return next(new ApiError(403, 'You are not authorized to perform this action'));
        }
        next();
    };
};

module.exports = authorize;