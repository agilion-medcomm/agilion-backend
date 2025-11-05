const { Prisma } = require("@prisma/client");

class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? "error" : "fail";
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }


}

// Global Error Handler
const errorHandler = (err, req, res, next) => {
    // Default 
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // --- Handle Specific Known Errors ---

    if (err.isJoi) {
        statusCode = 400;
        const error = err.details.map(detail => ({
            field: detail.path.join("."),
            message: detail.message.replace(/['"]/g, ''),
        }));

        return res.status(statusCode).json({
            status: 'error',
            message: 'Validation failed',
            errors: err,
        });
    }

    const finalStatusCode = statusCode || 500;

    res.status(finalStatusCode).json({
        status: `${finalStatusCode}`.startsWith('4') ? "error" : 'fail',
        message: message,
    });
};


module.exports = {
    ApiError,
    errorHandler,
};



