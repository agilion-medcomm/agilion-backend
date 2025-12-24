const { Prisma } = require("@prisma/client");
const { isProduction } = require("../../config/env");
const logger = require("../../utils/logger");

/**
 * ApiError - Custom error class for operational errors
 * These are errors we expect and handle gracefully
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? "error" : "fail";
        this.isOperational = true; // Flag to distinguish from programming errors

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handle Prisma-specific errors and convert them to user-friendly messages
 * @param {Error} err - Prisma error
 * @returns {Object} - { statusCode, message }
 */
const handlePrismaError = (err) => {
    // Prisma Client Known Request Error (P2xxx errors)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2000':
                return {
                    statusCode: 400,
                    message: 'The provided value is too long for the field.'
                };
            
            case 'P2001':
                return {
                    statusCode: 404,
                    message: 'The requested record does not exist.'
                };
            
            case 'P2002': {
                // Unique constraint violation
                const targets = Array.isArray(err.meta?.target) 
                    ? err.meta.target 
                    : [err.meta?.target].filter(Boolean);
                
            const isEmailOrTckn = targets.includes('email') || targets.includes('tckn');
            if (isEmailOrTckn) {
                    return {
                        statusCode: 409,
                        message: 'A user with this TCKN or email already exists.'
                    };
                }
                
                const fields = targets.length ? targets.join(', ') : 'field(s)';
                return {
                    statusCode: 409,
                    message: `A record with this ${fields} already exists.`
                };
            }
            
            case 'P2003':
                return {
                    statusCode: 400,
                    message: 'Foreign key constraint failed. The referenced record does not exist.'
                };
            
            case 'P2004':
                return {
                    statusCode: 400,
                    message: 'A constraint failed on the database.'
                };
            
            case 'P2005':
                return {
                    statusCode: 400,
                    message: 'The value stored in the database is invalid for the field type.'
                };
            
            case 'P2006':
                return {
                    statusCode: 400,
                    message: 'The provided value is invalid for the field.'
                };
            
            case 'P2007':
                return {
                    statusCode: 400,
                    message: 'Data validation error.'
                };
            
            case 'P2008':
                return {
                    statusCode: 500,
                    message: 'Failed to parse the query.'
                };
            
            case 'P2009':
                return {
                    statusCode: 500,
                    message: 'Failed to validate the query.'
                };
            
            case 'P2010':
                return {
                    statusCode: 500,
                    message: 'Raw query failed.'
                };
            
            case 'P2011':
                return {
                    statusCode: 400,
                    message: 'Null constraint violation. A required field is missing.'
                };
            
            case 'P2012':
                return {
                    statusCode: 400,
                    message: 'Missing a required value.'
                };
            
            case 'P2013':
                return {
                    statusCode: 400,
                    message: 'Missing a required argument.'
                };
            
            case 'P2014':
                return {
                    statusCode: 400,
                    message: 'The change would violate a required relation.'
                };
            
            case 'P2015':
                return {
                    statusCode: 404,
                    message: 'A related record could not be found.'
                };
            
            case 'P2016':
                return {
                    statusCode: 400,
                    message: 'Query interpretation error.'
                };
            
            case 'P2017':
                return {
                    statusCode: 400,
                    message: 'The records for the relation are not connected.'
                };
            
            case 'P2018':
                return {
                    statusCode: 400,
                    message: 'Required connected records were not found.'
                };
            
            case 'P2019':
                return {
                    statusCode: 400,
                    message: 'Input error.'
                };
            
            case 'P2020':
                return {
                    statusCode: 400,
                    message: 'Value out of range for the field type.'
                };
            
            case 'P2021':
                return {
                    statusCode: 500,
                    message: 'The table does not exist in the database.'
                };
            
            case 'P2022':
                return {
                    statusCode: 500,
                    message: 'The column does not exist in the database.'
                };
            
            case 'P2023':
                return {
                    statusCode: 400,
                    message: 'Inconsistent column data.'
                };
            
            case 'P2024':
                return {
                    statusCode: 503,
                    message: 'Timed out fetching a new connection from the pool.'
                };
            
            case 'P2025':
                return {
                    statusCode: 404,
                    message: 'The requested record was not found or has been deleted.'
                };
            
            case 'P2026':
                return {
                    statusCode: 500,
                    message: 'The database query does not support the current database provider.'
                };
            
            case 'P2027':
                return {
                    statusCode: 500,
                    message: 'Multiple errors occurred on the database during query execution.'
                };
            
            case 'P2028':
                return {
                    statusCode: 500,
                    message: 'Transaction API error.'
                };
            
            case 'P2029':
                return {
                    statusCode: 500,
                    message: 'Query engine error. Please try again later.'
                };
            
            case 'P2030':
                return {
                    statusCode: 500,
                    message: 'Cannot find a fulltext index to use for the search.'
                };
            
            case 'P2031':
                return {
                    statusCode: 500,
                    message: 'MongoDB replica set required.'
                };
            
            case 'P2032':
                return {
                    statusCode: 400,
                    message: 'Cannot parse the provided JSON value.'
                };
            
            case 'P2033':
                return {
                    statusCode: 400,
                    message: 'A number used in the query does not fit into a 64-bit signed integer.'
                };
            
            case 'P2034':
                return {
                    statusCode: 409,
                    message: 'Transaction failed due to a write conflict or a deadlock.'
                };
            
            default:
                // Unknown Prisma error code
                return {
                    statusCode: 500,
                    message: isProduction() 
                        ? 'A database error occurred.' 
                        : `Database error: ${err.code} - ${err.message}`
                };
        }
    }
    
    // Prisma Client Validation Error (before sending to DB)
    if (err instanceof Prisma.PrismaClientValidationError) {
        return {
            statusCode: 400,
            message: isProduction() 
                ? 'Invalid data provided.' 
                : err.message
        };
    }
    
    // Prisma Client Initialization Error (connection issues)
    if (err instanceof Prisma.PrismaClientInitializationError) {
        return {
            statusCode: 503,
            message: 'Database connection failed. Please try again later.'
        };
    }
    
    // Prisma Client Rust Panic Error (critical errors)
    if (err instanceof Prisma.PrismaClientRustPanicError) {
        return {
            statusCode: 500,
            message: 'A critical database error occurred. Please contact support.'
        };
    }
    
    // Prisma Client Unknown Request Error
    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        return {
            statusCode: 500,
            message: isProduction() 
                ? 'An unexpected database error occurred.' 
                : err.message
        };
    }
    
    // Not a Prisma error
    return null;
};

/**
 * Global Error Handler Middleware
 * Catches all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
    // Log the error (with full details in development)
    if (!isProduction()) {
        logger.error('Error caught by global handler:', {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode,
            isOperational: err.isOperational,
            code: err.code,
            meta: err.meta
        });
    } else {
        // In production, log less detail for security
        logger.error('Error occurred:', {
            message: err.message,
            statusCode: err.statusCode,
            isOperational: err.isOperational,
            path: req.path,
            method: req.method
        });
    }

    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = undefined;

    // Production'da operational olmayan hataların mesajlarını gizle
    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
        message = "An unexpected error occurred on the server.";
    }

    // --- Handle Joi Validation Errors ---
    if (err.isJoi) {
        statusCode = 400;
        errors = err.details.map(detail => ({
            field: detail.path.join("."),
            message: detail.message.replace(/['"]/g, ''),
        }));

        return res.status(statusCode).json({
            status: 'error',
            message: 'Validation failed.',
            errors: errors,
        });
    }

    // --- Handle Prisma Errors ---
    const prismaErrorInfo = handlePrismaError(err);
    if (prismaErrorInfo) {
        statusCode = prismaErrorInfo.statusCode;
        message = prismaErrorInfo.message;
    }

    // Send response with conditional stack trace in development
    res.status(statusCode).json({
        status: `${statusCode}`.startsWith('4') ? "error" : 'fail',
        message: message,
        ...(errors && { errors }), // Validation errors (Joi)
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            originalError: {
                name: err.name,
                code: err.code,
                meta: err.meta
            }
        })
    });
};

module.exports = {
    ApiError,
    errorHandler,
};
