/**
 * Application Configuration Constants
 * Centralizes magic numbers and configuration values
 */

// User Roles - Mirrors Prisma UserRole enum
const ROLES = Object.freeze({
    PATIENT: 'PATIENT',
    DOCTOR: 'DOCTOR',
    ADMIN: 'ADMIN',
    CASHIER: 'CASHIER',
    LABORANT: 'LABORANT',
    CLEANER: 'CLEANER',
});

// Role arrays for authorization checks
const ROLE_GROUPS = Object.freeze({
    ALL: Object.values(ROLES),
    PERSONNEL: [ROLES.DOCTOR, ROLES.ADMIN, ROLES.CASHIER, ROLES.LABORANT, ROLES.CLEANER],
    MEDICAL_STAFF: [ROLES.DOCTOR, ROLES.LABORANT],
    CAN_VIEW_PATIENTS: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.CASHIER],
});

// Blood Types
const BLOOD_TYPES = Object.freeze([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
]);

// Appointment Status - Mirrors Prisma AppointmentStatus enum
const APPOINTMENT_STATUS = Object.freeze({
    APPROVED: 'APPROVED',
    CANCELLED: 'CANCELLED',
    DONE: 'DONE',
});

// Leave Request Status
const LEAVE_REQUEST_STATUS = Object.freeze({
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
});

// Contact Issue Status
const CONTACT_STATUS = Object.freeze({
    PENDING: 'PENDING',
    REPLIED: 'REPLIED',
});

module.exports = {
    // User Roles
    ROLES,
    ROLE_GROUPS,
    BLOOD_TYPES,
    APPOINTMENT_STATUS,
    LEAVE_REQUEST_STATUS,
    CONTACT_STATUS,

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
        TOKEN_BYTE_LENGTH: 32,
    },

    // Request Timeout Configuration
    TIMEOUT: {
        REQUEST_MS: 30000, // 30 seconds
    },

    // File Upload Configuration
    FILE_UPLOAD: {
        MAX_SIZE_MB: 10,
        MAX_SIZE_BYTES: 3 * 1024 * 1024, // 3 MB
        ALLOWED_MEDICAL_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
        ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'],
    },

    // Pagination Configuration
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
    },

    // Rate Limiting Configuration
    RATE_LIMIT: {
        ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false', // Disable with RATE_LIMIT_ENABLED=false
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100, // per window
        LOGIN_MAX_ATTEMPTS: 5, // login attempts per window
        PASSWORD_RESET_MAX_ATTEMPTS: 3, // password reset attempts per window
    },

    // Environment-based Feature Flags
    FEATURES: {
        // Email sending - disable for testing without email service
        EMAIL_ENABLED: process.env.EMAIL_ENABLED !== 'false',
    },

    // Security Configuration - Environment-based
    SECURITY: {
        // Helmet configuration
        HELMET_ENABLED: process.env.HELMET_ENABLED !== 'false',
        
        // Content Security Policy - more relaxed in development
        CSP_ENABLED: process.env.CSP_ENABLED !== 'false',
        
        // CORS origins - comma-separated list or '*' for all
        CORS_ORIGINS: process.env.CORS_ORIGINS 
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : ['http://localhost:5173', 'http://localhost:5174', 'https://zeytinburnucerrahitipmerkezi.com', 'https://www.zeytinburnucerrahitipmerkezi.com'],
        
        // Trust proxy (for production behind load balancer)
        TRUST_PROXY: process.env.TRUST_PROXY === 'true',
    },

    // Environment Detection
    ENV: {
        IS_PRODUCTION: process.env.NODE_ENV === 'production',
        IS_DEVELOPMENT: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
        IS_TEST: process.env.NODE_ENV === 'test',
    },

    // Validation Patterns
    VALIDATION: {
        TCKN_LENGTH: 11,
        TCKN_PATTERN: /^[0-9]{11}$/,
        PHONE_PATTERN: /^\+?[0-9\s-]{10,15}$/,
        DATE_ISO_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
        DATE_TR_PATTERN: /^\d{2}\.\d{2}\.\d{4}$/,
        TIME_PATTERN: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
    },
};
