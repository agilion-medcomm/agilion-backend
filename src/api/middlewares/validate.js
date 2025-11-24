const { ApiError } = require("./errorHandler.js");

const validate = (schema) => (req, res, next) => {
    console.log("GELEN VERİ (Body):", req.body);
    // abort early false to collect all errors instead of stopping at the first one
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        // if validation fails we pass it to global errorHandler
        console.log("VALIDATION HATASI:", error.details[0].message);
        return next(error)
    }

    // If validation passes, move on with the next
    next();
};

module.exports = validate;
