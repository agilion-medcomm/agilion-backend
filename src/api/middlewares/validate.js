const { ApiError } = require("./errorHandler.js");

const validate = (schema) => (req, res, next) => {

    const { error } = schema.validate(req.body);

    if (error) {
        // if validation fails we pass it to global errorHandler
        return next(error)
    }

    // If validation passes, move on with the next
    next();
};


module.exports = validate;

