/**
 * Centralized Input Sanitization Utilities
 * Provides consistent sanitization across the application
 * to prevent XSS, injection attacks, and normalize input data
 */

/**
 * Escape HTML entities to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
const escapeHtml = (str) => {
    if (!str || typeof str !== 'string') {
        return str;
    }

    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
};

/**
 * Trim and normalize whitespace in a string
 * @param {string} str - String to normalize
 * @returns {string} - Normalized string
 */
const normalizeWhitespace = (str) => {
    if (!str || typeof str !== 'string') {
        return str;
    }
    return str.trim().replace(/\s+/g, ' ');
};

/**
 * Sanitize email - lowercase and trim
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
const sanitizeEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return email;
    }
    return email.toLowerCase().trim();
};

/**
 * Sanitize TCKN - remove non-digit characters
 * @param {string} tckn - TCKN to sanitize
 * @returns {string} - Sanitized TCKN (digits only)
 */
const sanitizeTckn = (tckn) => {
    if (!tckn || typeof tckn !== 'string') {
        return tckn;
    }
    return tckn.replace(/\D/g, '');
};

/**
 * Sanitize phone number - remove spaces but keep + and digits
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
const sanitizePhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') {
        return phone;
    }
    return phone.replace(/[^\d+]/g, '');
};

/**
 * Sanitize a name field - trim, normalize whitespace, escape HTML
 * @param {string} name - Name to sanitize
 * @returns {string} - Sanitized name
 */
const sanitizeName = (name) => {
    if (!name || typeof name !== 'string') {
        return name;
    }
    return escapeHtml(normalizeWhitespace(name));
};

/**
 * Sanitize user input for database storage
 * Handles common XSS patterns and normalizes data
 * @param {Object} data - Object with user input fields
 * @param {Object} options - Sanitization options
 * @returns {Object} - Sanitized data object
 */
const sanitizeUserInput = (data, options = {}) => {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sanitized = { ...data };

    // Define field-specific sanitizers
    const fieldSanitizers = {
        email: sanitizeEmail,
        tckn: sanitizeTckn,
        phoneNumber: sanitizePhoneNumber,
        phone: sanitizePhoneNumber,
        firstName: sanitizeName,
        lastName: sanitizeName,
        name: sanitizeName,
    };

    for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'string') {
            // Apply field-specific sanitizer if exists
            if (fieldSanitizers[key]) {
                sanitized[key] = fieldSanitizers[key](value);
            } else if (options.escapeHtml !== false) {
                // Default: escape HTML and normalize whitespace
                sanitized[key] = escapeHtml(normalizeWhitespace(value));
            } else {
                sanitized[key] = normalizeWhitespace(value);
            }
        }
    }

    return sanitized;
};

/**
 * Strip dangerous characters that could be used for SQL/NoSQL injection
 * 
 * IMPORTANT: This is an OPTIONAL defense-in-depth measure, NOT the primary protection.
 * The primary protection is Prisma's parameterized queries which automatically escape values.
 * 
 * This function is exported for cases where you need extra sanitization (e.g., dynamic queries,
 * logging user input, or when building strings that will be evaluated). In most cases, you
 * should NOT need to use this function - Prisma handles SQL injection protection automatically.
 * 
 * @param {string} str - String to clean
 * @returns {string} - Cleaned string
 */
const stripDangerousChars = (str) => {
    if (!str || typeof str !== 'string') {
        return str;
    }
    // Remove characters commonly used in SQL/NoSQL injection
    return str.replace(/[${}()[\];'"`\\]/g, '');
};

module.exports = {
    escapeHtml,
    normalizeWhitespace,
    sanitizeEmail,
    sanitizeTckn,
    sanitizePhoneNumber,
    sanitizeName,
    sanitizeUserInput,
    stripDangerousChars,
};
