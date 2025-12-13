/**
 * Centralized Validation Utilities
 * Reusable validation functions that can be used across the application
 * Uses constants from config/constants.js for consistency
 */

const { VALIDATION, AUTH } = require('../config/constants');
const { ApiError } = require('../api/middlewares/errorHandler');

/**
 * Validate TCKN (Turkish Citizen ID Number)
 * @param {string} tckn - TCKN to validate
 * @returns {boolean} - True if valid
 */
const isValidTckn = (tckn) => {
    if (!tckn || typeof tckn !== 'string') {
        return false;
    }
    return VALIDATION.TCKN_PATTERN.test(tckn);
};

/**
 * Validate and throw if TCKN is invalid
 * @param {string} tckn - TCKN to validate
 * @throws {ApiError} - If TCKN is invalid
 */
const validateTckn = (tckn) => {
    if (!isValidTckn(tckn)) {
        throw new ApiError(400, `TCKN must be exactly ${VALIDATION.TCKN_LENGTH} digits.`);
    }
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    return VALIDATION.PHONE_PATTERN.test(phone);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 * Uses AUTH.PASSWORD_MIN_LENGTH from constants
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
    const errors = [];
    const minLength = AUTH.PASSWORD_MIN_LENGTH;

    if (!password || password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Check if a string is empty or only whitespace
 * @param {string} str - String to check
 * @returns {boolean} - True if empty or whitespace only
 */
const isEmpty = (str) => {
    return !str || (typeof str === 'string' && str.trim().length === 0);
};

/**
 * Check if value is a positive integer
 * Validates that input is a clean integer string/number without whitespace or decimals
 * @param {*} value - Value to check
 * @returns {boolean} - True if positive integer
 */
const isPositiveInteger = (value) => {
    // Handle numbers directly
    if (typeof value === 'number') {
        return Number.isInteger(value) && value > 0;
    }
    // For strings, validate format strictly (no whitespace, no decimals, no leading zeros except for single '0')
    if (typeof value === 'string') {
        // Reject if has leading/trailing whitespace
        if (value !== value.trim()) {
            return false;
        }
        // Must match positive integer pattern (no leading zeros except "0")
        if (!/^[1-9]\d*$/.test(value)) {
            return false;
        }
        const num = parseInt(value, 10);
        return !isNaN(num) && num > 0;
    }
    return false;
};

/**
 * Validate required fields in an object
 * @param {Object} data - Object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @throws {ApiError} - If any required field is missing
 */
const validateRequiredFields = (data, requiredFields) => {
    const missingFields = requiredFields.filter(field => isEmpty(data[field]));
    
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }
};

/**
 * Joi custom validator for TCKN
 * Use in Joi schemas: Joi.string().custom(joiTcknValidator)
 */
const joiTcknValidator = (value, helpers) => {
    if (!value) {
        return value;
    }

    if (!isValidTckn(value)) {
        return helpers.error('any.invalid');
    }

    return value;
};

/**
 * Joi custom validator for password strength
 * Use in Joi schemas: Joi.string().custom(joiPasswordValidator)
 */
const joiPasswordValidator = (value, helpers) => {
    if (!value) {
        return value;
    }

    const result = validatePasswordStrength(value);
    if (!result.isValid) {
        return helpers.message(result.errors[0]);
    }

    return value;
};

module.exports = {
    // Validators (return boolean)
    isValidTckn,
    isValidPhone,
    isValidEmail,
    isEmpty,
    isPositiveInteger,

    // Validators (throw on error)
    validateTckn,
    validatePasswordStrength,
    validateRequiredFields,

    // Joi helpers
    joiTcknValidator,
    joiPasswordValidator,
};
