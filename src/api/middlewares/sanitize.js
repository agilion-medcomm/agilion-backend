/**
 * Input Sanitization Middleware
 * Automatically sanitizes common fields in request body
 * Apply before validation middleware
 */

const { 
    sanitizeEmail, 
    sanitizeTckn, 
    sanitizePhoneNumber,
    sanitizeUserInput,
    normalizeWhitespace 
} = require('../../utils/sanitizer');

/**
 * Fields and their sanitization functions
 */
const FIELD_SANITIZERS = {
    email: sanitizeEmail,
    tckn: sanitizeTckn,
    phoneNumber: sanitizePhoneNumber,
    phone: sanitizePhoneNumber,
    firstName: sanitizeUserInput,
    lastName: sanitizeUserInput,
    name: sanitizeUserInput,
    subject: sanitizeUserInput,
    message: normalizeWhitespace,
    replyMessage: normalizeWhitespace,
    address: sanitizeUserInput,
    emergencyContact: sanitizeUserInput,
    testName: sanitizeUserInput,
    description: normalizeWhitespace,
    specialization: sanitizeUserInput,
};

/**
 * Sanitize request body fields
 * Applies appropriate sanitization based on field name
 */
const sanitizeBody = (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
        return next();
    }

    for (const [field, sanitizer] of Object.entries(FIELD_SANITIZERS)) {
        if (req.body[field] !== undefined && typeof req.body[field] === 'string') {
            req.body[field] = sanitizer(req.body[field]);
        }
    }

    next();
};

/**
 * Sanitize specific fields only
 * Usage: sanitizeFields('email', 'tckn', 'phoneNumber')
 */
const sanitizeFields = (...fields) => {
    return (req, res, next) => {
        if (!req.body || typeof req.body !== 'object') {
            return next();
        }

        for (const field of fields) {
            const sanitizer = FIELD_SANITIZERS[field];
            if (sanitizer && req.body[field] !== undefined && typeof req.body[field] === 'string') {
                req.body[field] = sanitizer(req.body[field]);
            }
        }

        next();
    };
};

module.exports = {
    sanitizeBody,
    sanitizeFields,
};
