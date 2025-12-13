const bcrypt = require('bcrypt');
const { AUTH } = require('../config/constants');
const { validatePasswordStrength } = require('./validators');

/**
 * Centralized Password Hashing Utilities
 * Ensures consistent bcrypt configuration across the application
 * 
 * For password validation, use validatePasswordStrength from validators.js
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

module.exports = {
    hashPassword,
    comparePassword,
    // Re-export for backwards compatibility
    validatePasswordStrength,
};
