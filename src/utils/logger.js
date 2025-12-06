/**
 * Centralized Logging Utility
 * Provides consistent logging across the application
 * Can be easily extended to use Winston or other logging libraries
 */

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
};

/**
 * Format log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {string} - Formatted log message
 */
const formatLogMessage = (level, message, context = {}) => {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or context
 */
const error = (message, error = null) => {
    const context = error instanceof Error 
        ? { error: error.message, stack: error.stack } 
        : error || {};
    console.error(formatLogMessage(LOG_LEVELS.ERROR, message, context));
};

/**
 * Log warning message
 * @param {string} message - Warning message
 * @param {Object} context - Additional context
 */
const warn = (message, context = {}) => {
    console.warn(formatLogMessage(LOG_LEVELS.WARN, message, context));
};

/**
 * Log info message
 * @param {string} message - Info message
 * @param {Object} context - Additional context
 */
const info = (message, context = {}) => {
    console.log(formatLogMessage(LOG_LEVELS.INFO, message, context));
};

/**
 * Log debug message (only in development)
 * @param {string} message - Debug message
 * @param {Object} context - Additional context
 */
const debug = (message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(formatLogMessage(LOG_LEVELS.DEBUG, message, context));
    }
};

/**
 * Log file operation failure
 * @param {string} operation - Operation name
 * @param {string} filePath - File path
 * @param {Error} error - Error object
 */
const fileOperationError = (operation, filePath, error) => {
    const message = `Failed to ${operation} file`;
    const context = { filePath, error: error.message };
    console.error(formatLogMessage(LOG_LEVELS.ERROR, message, context));
};

module.exports = {
    error,
    warn,
    info,
    debug,
    fileOperationError,
    LOG_LEVELS,
};
