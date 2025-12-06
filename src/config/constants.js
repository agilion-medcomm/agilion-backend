/**
 * Application Configuration Constants
 * Centralizes magic numbers and configuration values
 */

module.exports = {
    // Working Hours Configuration
    WORKING_HOURS: {
        START: 9,
        END: 17,
        INTERVAL_MINUTES: 30,
    },

    // Authentication Configuration
    AUTH: {
        BCRYPT_ROUNDS: 12,
        JWT_EXPIRY: '30m',
        PASSWORD_MIN_LENGTH: 8,
        PASSWORD_RESET_TOKEN_EXPIRY_HOURS: 1,
        EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS: 24,
    },

    // File Upload Configuration
    FILE_UPLOAD: {
        MAX_SIZE_MB: 10,
        MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
        ALLOWED_MEDICAL_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
        ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'],
    },

    // Pagination Configuration
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
    },

    // Request Configuration
    REQUEST: {
        TIMEOUT_MS: 30000, // 30 seconds
    },

    // Status Values
    STATUS: {
        APPOINTMENT: {
            PENDING: 'PENDING',
            APPROVED: 'APPROVED',
            CANCELLED: 'CANCELLED',
            COMPLETED: 'COMPLETED',
        },
        LEAVE_REQUEST: {
            PENDING: 'PENDING',
            APPROVED: 'APPROVED',
            REJECTED: 'REJECTED',
        },
        CONTACT: {
            PENDING: 'PENDING',
            REPLIED: 'REPLIED',
        },
    },

    // User Roles
    ROLES: {
        PATIENT: 'PATIENT',
        DOCTOR: 'DOCTOR',
        ADMIN: 'ADMIN',
        CASHIER: 'CASHIER',
        LABORANT: 'LABORANT',
    },
};
