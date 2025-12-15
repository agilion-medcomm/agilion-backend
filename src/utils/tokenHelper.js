const crypto = require('crypto');
const { AUTH } = require('../config/constants');

/**
 * Centralized Token Generation and Hashing Utilities
 * Used for email verification, password reset, and other token-based flows
 */

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default from constants)
 * @returns {string} - Random hex token
 */
const generateSecureToken = (length = AUTH.TOKEN_BYTE_LENGTH) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a token using SHA-256
 * Security best practice: Store hashed tokens in database
 * @param {string} token - Plain token to hash
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate and hash a token in one step
 * Returns both plain and hashed versions
 * @param {number} length - Token length in bytes (default from constants)
 * @returns {Object} - { token: string, hashedToken: string }
 */
const generateAndHashToken = (length = AUTH.TOKEN_BYTE_LENGTH) => {
    const token = generateSecureToken(length);
    const hashedToken = hashToken(token);
    
    return { token, hashedToken };
};

/**
 * Generate token expiry date
 * @param {number} hoursFromNow - Hours until expiry (default from constants)
 * @returns {Date} - Expiry date
 */
const generateTokenExpiry = (hoursFromNow = AUTH.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS) => {
    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
};

/**
 * Check if token is expired
 * @param {Date} expiryDate - Token expiry date
 * @returns {boolean} - True if expired
 */
const isTokenExpired = (expiryDate) => {
    return new Date() > new Date(expiryDate);
};

module.exports = {
    generateSecureToken,
    hashToken,
    generateAndHashToken,
    generateTokenExpiry,
    isTokenExpired,
};
