const { ApiError } = require("./errorHandler.js");

/**
 * Joi validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {Object} options - Options { property: 'body'|'params'|'query' }
 */
const validate = (schema, options = { property: 'body' }) => (req, res, next) => {
    const property = (options && options.property) || 'body';
    const target = req[property] || {};

    // abortEarly false to collect all errors
    const { error } = schema.validate(target, { abortEarly: false });

    if (error) {
        // Joi error - pass to global error handler which knows how to format it
        return next(error);
    }

    next();
};

module.exports = validate;
