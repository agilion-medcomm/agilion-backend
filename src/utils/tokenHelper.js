const crypto = require('crypto');

/**
 * Centralized Token Generation and Hashing Utilities
 * Used for email verification, password reset, and other token-based flows
 */

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Random hex token
 */
const generateSecureToken = (length = 32) => {
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
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {Object} - { token: string, hashedToken: string }
 */
const generateAndHashToken = (length = 32) => {
    const token = generateSecureToken(length);
    const hashedToken = hashToken(token);
    
    return { token, hashedToken };
};

/**
 * Generate token expiry date
 * @param {number} hoursFromNow - Hours until expiry (default: 24)
 * @returns {Date} - Expiry date
 */
const generateTokenExpiry = (hoursFromNow = 24) => {
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
