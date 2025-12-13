/**
 * Environment Variable Validation
 * Ensures required environment variables are present at startup
 */

const logger = require('../utils/logger');

/**
 * Required environment variables
 * Add all required env vars here with their descriptions
 */
const REQUIRED_ENV_VARS = [
    { name: 'JWT_SECRET', description: 'Secret key for JWT token signing' },
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string for Prisma' },
];

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = [
    { name: 'PORT', default: '3001', description: 'Server port' },
    { name: 'NODE_ENV', default: 'development', description: 'Environment mode' },
    { name: 'EMAIL_SERVICE', default: 'gmail', description: 'Email service provider' },
    { name: 'FRONTEND_URL', default: 'http://localhost:5173', description: 'Frontend URL for links in emails' },
];

/**
 * Email-related env vars (required for email functionality)
 */
const EMAIL_ENV_VARS = [
    { name: 'EMAIL_USER', description: 'Email address for sending emails' },
    { name: 'EMAIL_PASSWORD', description: 'Email password or app-specific password' },
];

/**
 * Validate that all required environment variables are present
 * Logs warnings for missing optional variables
 * @throws {Error} - If any required variable is missing
 */
const validateEnv = () => {
    const missing = [];
    const warnings = [];

    // Check required variables
    for (const { name, description } of REQUIRED_ENV_VARS) {
        if (!process.env[name]) {
            missing.push(`  - ${name}: ${description}`);
        }
    }

    // Check optional variables and set defaults
    for (const { name, default: defaultValue } of OPTIONAL_ENV_VARS) {
        if (!process.env[name]) {
            process.env[name] = defaultValue;
            logger.debug(`Using default for ${name}: ${defaultValue}`);
        }
    }

    // Check email variables (warn if missing, don't fail)
    const emailMissing = EMAIL_ENV_VARS.filter(({ name }) => !process.env[name]);
    if (emailMissing.length > 0) {
        warnings.push('Email functionality will be disabled. Missing:');
        emailMissing.forEach(({ name, description }) => {
            warnings.push(`  - ${name}: ${description}`);
        });
    }

    // Log warnings
    if (warnings.length > 0) {
        logger.warn('Environment configuration warnings:\n' + warnings.join('\n'));
    }

    // Throw if required vars are missing
    if (missing.length > 0) {
        const errorMessage = `Missing required environment variables:\n${missing.join('\n')}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    logger.info('Environment validation passed');
};

/**
 * Get environment variable with type conversion
 * @param {string} name - Variable name
 * @param {*} defaultValue - Default value if not set
 * @returns {string|number|boolean} - Typed value
 */
const getEnv = (name, defaultValue = undefined) => {
    const value = process.env[name];
    
    if (value === undefined) {
        return defaultValue;
    }
    
    // Try to parse as number
    if (/^\d+$/.test(value)) {
        return parseInt(value, 10);
    }
    
    // Parse booleans
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    return value;
};

/**
 * Check if we're in production environment
 * @returns {boolean}
 */
const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Check if we're in development environment
 * @returns {boolean}
 */
const isDevelopment = () => process.env.NODE_ENV === 'development';

module.exports = {
    validateEnv,
    getEnv,
    isProduction,
    isDevelopment,
};
