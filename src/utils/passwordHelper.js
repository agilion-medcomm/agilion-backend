const bcrypt = require('bcrypt');
const { AUTH } = require('../config/constants');

/**
 * Centralized Password Hashing Utilities
 * Ensures consistent bcrypt configuration across the application
 */

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(AUTH.BCRYPT_ROUNDS);
    return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Validate password strength (basic validation)
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result { isValid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
    const errors = [];
    
    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters long');
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

module.exports = {
    hashPassword,
    comparePassword,
    validatePasswordStrength,
    BCRYPT_SALT_ROUNDS,
};
