/**
 * Centralized Response Formatting Utilities
 * Ensures consistent API response structure across all endpoints
 */

/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @returns {Object} - Formatted success response
 */
const successResponse = (data, message = null) => {
    const response = {
        status: 'success',
    };
    
    if (message) {
        response.message = message;
    }
    
    if (data !== undefined) {
        response.data = data;
    }
    
    return response;
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {Array|Object} errors - Optional validation errors
 * @returns {Object} - Formatted error response
 */
const errorResponse = (message, errors = null) => {
    const response = {
        status: 'error',
        message,
    };
    
    if (errors) {
        response.errors = errors;
    }
    
    return response;
};

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data, message = null, statusCode = 200) => {
    return res.status(statusCode).json(successResponse(data, message));
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Array|Object} errors - Optional validation errors
 */
const sendError = (res, message, statusCode = 400, errors = null) => {
    return res.status(statusCode).json(errorResponse(message, errors));
};

/**
 * Send created resource response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
const sendCreated = (res, data, message) => {
    return sendSuccess(res, data, message, 201);
};

module.exports = {
    successResponse,
    errorResponse,
    sendSuccess,
    sendError,
    sendCreated,
};
