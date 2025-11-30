const { ApiError } = require('../api/middlewares/errorHandler');

/**
 * Centralized Date and Time Validation Utilities
 * 
 * Supported formats:
 * - Appointment dates: DD.MM.YYYY (e.g., 25.11.2025)
 * - ISO dates: YYYY-MM-DD (e.g., 2025-11-25)
 * - Times: HH:MM (e.g., 14:30)
 */

/**
 * Validate date format DD.MM.YYYY
 * @param {string} date - Date string to validate
 * @returns {boolean} - True if valid
 */
const validateAppointmentDateFormat = (date) => {
    if (!date || typeof date !== 'string') {
        return false;
    }

    // Check format: DD.MM.YYYY
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = date.match(dateRegex);
    
    if (!match) {
        return false;
    }

    const [, day, month, year] = match;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Validate ranges
    if (monthNum < 1 || monthNum > 12) {
        return false;
    }

    if (dayNum < 1 || dayNum > 31) {
        return false;
    }

    // Validate actual calendar date
    const dateObj = new Date(parseInt(yearNum, 10), parseInt(monthNum, 10) - 1, parseInt(dayNum, 10));
    return (
        dateObj.getFullYear() === yearNum &&
        dateObj.getMonth() === monthNum - 1 &&
        dateObj.getDate() === dayNum
    );
};

/**
 * Validate date format YYYY-MM-DD
 * @param {string} date - Date string to validate
 * @returns {boolean} - True if valid
 */
const validateISODateFormat = (date) => {
    if (!date || typeof date !== 'string') {
        return false;
    }

    // Check format: YYYY-MM-DD
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = date.match(dateRegex);
    
    if (!match) {
        return false;
    }

    const [, year, month, day] = match;
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    // Validate ranges
    if (monthNum < 1 || monthNum > 12) {
        return false;
    }

    if (dayNum < 1 || dayNum > 31) {
        return false;
    }

    // Validate actual calendar date
    const dateObj = new Date(Date.UTC(parseInt(yearNum, 10), parseInt(monthNum, 10) - 1, parseInt(dayNum, 10)));
    return (
        dateObj.getUTCFullYear() === yearNum &&
        dateObj.getUTCMonth() === monthNum - 1 &&
        dateObj.getUTCDate() === dayNum
    );
};

/**
 * Validate time format HH:MM
 * @param {string} time - Time string to validate
 * @returns {boolean} - True if valid
 */
const validateTimeFormat = (time) => {
    if (!time || typeof time !== 'string') {
        return false;
    }

    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
};

/**
 * Parse date from DD.MM.YYYY format
 * @param {string} date - Date string in DD.MM.YYYY format
 * @returns {object} - Object with day, month, year
 * @throws {ApiError} - If date format is invalid
 */
const parseAppointmentDate = (date) => {
    if (!validateAppointmentDateFormat(date)) {
        throw new ApiError(400, 'Invalid date format. Expected DD.MM.YYYY (e.g., 25.11.2025).');
    }

    const [day, month, year] = date.split('.');
    return {
        day: parseInt(day, 10),
        month: parseInt(month, 10),
        year: parseInt(year, 10),
    };
};

/**
 * Parse date from YYYY-MM-DD format
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {object} - Object with year, month, day
 * @throws {ApiError} - If date format is invalid
 */
const parseISODate = (date) => {
    if (!validateISODateFormat(date)) {
        throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD (e.g., 2025-11-25).');
    }

    const [year, month, day] = date.split('-');
    return {
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        day: parseInt(day, 10),
    };
};

/**
 * Convert YYYY-MM-DD to Date object safely
 * @param {string|null} isoDate - Date string in YYYY-MM-DD format or null
 * @returns {Date|null} - Date object or null
 * @throws {ApiError} - If date format is invalid
 */
const isoDateToObject = (isoDate) => {
    if (!isoDate) {
        return null;
    }

    if (!validateISODateFormat(isoDate)) {
        throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD (e.g., 2025-11-25).');
    }

    // Use UTC to avoid timezone issues
    return new Date(`${isoDate}T00:00:00.000Z`);
};

/**
 * Validate and create a Date object from YYYY-MM-DD and HH:MM
 * @param {string} isoDate - Date string in YYYY-MM-DD format
 * @param {string} time - Time string in HH:MM format
 * @returns {Date} - Date object
 * @throws {ApiError} - If date or time format is invalid
 */
const createDateTimeFromISO = (isoDate, time) => {
    if (!validateISODateFormat(isoDate)) {
        throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD (e.g., 2025-11-25).');
    }

    if (!validateTimeFormat(time)) {
        throw new ApiError(400, 'Invalid time format. Expected HH:MM (e.g., 14:30).');
    }

    const dateTime = new Date(`${isoDate}T${time}`);
    
    if (isNaN(dateTime.getTime())) {
        throw new ApiError(400, 'Invalid date/time combination.');
    }

    return dateTime;
};

/**
 * Validate date and time formats with detailed error messages
 * @param {string} date - Date string (format depends on formatType)
 * @param {string} time - Time string in HH:MM format
 * @param {string} formatType - 'appointment' (DD.MM.YYYY) or 'iso' (YYYY-MM-DD)
 * @throws {ApiError} - If validation fails
 */
const validateDateTime = (date, time, formatType = 'appointment') => {
    // Validate date based on format type
    if (formatType === 'appointment') {
        if (!validateAppointmentDateFormat(date)) {
            throw new ApiError(400, 'Invalid date format. Expected DD.MM.YYYY (e.g., 25.11.2025).');
        }
    } else if (formatType === 'iso') {
        if (!validateISODateFormat(date)) {
            throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD (e.g., 2025-11-25).');
        }
    } else {
        throw new ApiError(400, 'Invalid format type specified.');
    }

    // Validate time
    if (!validateTimeFormat(time)) {
        throw new ApiError(400, 'Invalid time format. Expected HH:MM (e.g., 14:30).');
    }
};

/**
 * Joi custom validator for YYYY-MM-DD date format
 * Use this in Joi schemas for consistent validation
 * @param {string} value - Date string to validate
 * @param {object} helpers - Joi helpers object
 * @returns {string} - Original value if valid
 */
const joiISODateValidator = (value, helpers) => {
    if (!value) {
        return value;
    }

    if (!validateISODateFormat(value)) {
        return helpers.error('any.invalid');
    }

    return value;
};

module.exports = {
    // Validators
    validateAppointmentDateFormat,
    validateISODateFormat,
    validateTimeFormat,
    validateDateTime,
    
    // Parsers
    parseAppointmentDate,
    parseISODate,
    
    // Converters
    isoDateToObject,
    createDateTimeFromISO,
    
    // Joi helper
    joiISODateValidator,
};
