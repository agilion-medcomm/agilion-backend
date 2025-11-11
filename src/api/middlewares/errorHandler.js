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
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 stands for unique constraint failed
        if (err.code === 'P2002') {
            statusCode = 409;
            const targets = Array.isArray(err.meta?.target) ? err.meta.target : [err.meta?.target].filter(Boolean);
            // Contract requires a unified message for email or TCKN conflicts
            const isEmailOrTckn = targets.includes('email') || targets.includes('tckn');
            if (isEmailOrTckn) {
                message = 'A user with this TCKN or email already exists.';
            } else {
                const fields = targets.length ? targets.join(', ') : 'field(s)';
                message = `A user with this ${fields} already exists.`;
            }
        }
    }

    if (err.isJoi) {
        statusCode = 400;
        const error = err.details.map(detail => ({
            field: detail.path.join("."),
            message: detail.message.replace(/['"]/g, ''),
        }));

        return res.status(statusCode).json({
            status: 'error',
            message: 'Validation failed.',
            errors: error,
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
