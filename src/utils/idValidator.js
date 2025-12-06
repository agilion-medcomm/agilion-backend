const { ApiError } = require('../api/middlewares/errorHandler');

/**
 * Centralized ID Validation Utilities
 * Prevents NaN injection and ensures IDs are positive integers
 */

/**
 * Parse and validate an ID parameter
 * @param {string|number} id - ID value to validate
 * @param {string} fieldName - Name of the field for error messages (default: 'ID')
 * @returns {number} - Validated positive integer
 * @throws {ApiError} - If ID is invalid
 */
const parseAndValidateId = (id, fieldName = 'ID') => {
    const parsed = parseInt(id, 10);
    
    if (isNaN(parsed)) {
        throw new ApiError(400, `Invalid ${fieldName}. Must be a number.`);
    }
    
    if (parsed <= 0) {
        throw new ApiError(400, `Invalid ${fieldName}. Must be a positive number.`);
    }
    
    return parsed;
};

/**
 * Parse and validate multiple IDs at once
 * @param {Object} ids - Object containing id key-value pairs
 * @returns {Object} - Object with validated IDs
 * @throws {ApiError} - If any ID is invalid
 * 
 * @example
 * const { userId, doctorId } = parseAndValidateIds({ 
 *   userId: req.params.userId,
 *   doctorId: req.params.doctorId 
 * });
 */
const parseAndValidateIds = (ids) => {
    const validated = {};
    
    for (const [key, value] of Object.entries(ids)) {
        validated[key] = parseAndValidateId(value, key);
    }
    
    return validated;
};

/**
 * Safely parse ID without throwing (returns null if invalid)
 * Useful for optional ID fields
 * @param {string|number} id - ID value to validate
 * @returns {number|null} - Validated ID or null if invalid
 */
const safeParseId = (id) => {
    const parsed = parseInt(id, 10);
    
    if (isNaN(parsed) || parsed <= 0) {
        return null;
    }
    
    return parsed;
};

module.exports = {
    parseAndValidateId,
    parseAndValidateIds,
    safeParseId,
};
