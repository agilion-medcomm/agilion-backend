const Joi = require('joi');
const { joiISODateValidator } = require('../../utils/dateTimeValidator');
const { AUTH, VALIDATION, ROLES, ROLE_GROUPS } = require('../../config/constants');

// Schema for POST /api/v1/auth/register
const registerSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    tckn: Joi.string().length(VALIDATION.TCKN_LENGTH).pattern(/^[0-9]+$/).required().messages({
        'string.length': `TCKN must be ${VALIDATION.TCKN_LENGTH} digits.`,
        'string.pattern.base': 'TCKN must only contain digits.',
    }),
    role: Joi.string().valid(ROLES.PATIENT).default(ROLES.PATIENT), // Only PATIENT allowed for public registration
    // Enforce format AND real calendar date using centralized validator
    dateOfBirth: Joi.string()
        .pattern(VALIDATION.DATE_ISO_PATTERN)
        .required()
        .custom(joiISODateValidator, 'ISO date validation')
        .messages({
            'string.pattern.base': 'Invalid date format. Use YYYY-MM-DD.',
            'any.invalid': 'Invalid date format. Use YYYY-MM-DD.',
        }),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    password: Joi.string().min(AUTH.PASSWORD_MIN_LENGTH).required().messages({
        'string.min': `Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters long.`,
    }),
});

// Schema for POST /api/v1/auth/login
const loginSchema = Joi.object({
    tckn: Joi.string().length(VALIDATION.TCKN_LENGTH).required().messages({
        'string.length': `TCKN must be ${VALIDATION.TCKN_LENGTH} digits.`,
    }),
    password: Joi.string().required(),
});

const personnelRegisterSchema = Joi.object({
    token: Joi.string().required(), // admin JWT, validated in service
    tckn: Joi.string().length(VALIDATION.TCKN_LENGTH).pattern(/^[0-9]+$/).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    password: Joi.string().min(AUTH.PASSWORD_MIN_LENGTH).required(),
    // Allow ADMIN, DOCTOR, CASHIER, LABORANT, and CLEANER roles.
    role: Joi.string().valid(...ROLE_GROUPS.PERSONNEL).required(),
    phoneNumber: Joi.string().allow('').optional(),
    email: Joi.string().email().allow('').optional(),
    dateOfBirth: Joi.alternatives().try(
        Joi.string().pattern(VALIDATION.DATE_ISO_PATTERN).custom(joiISODateValidator, 'ISO date validation'),
        Joi.valid(null)
    ).optional(),
    // specialization is required for DOCTOR, should be empty for ADMIN; service can enforce if needed.
    specialization: Joi.string().allow('').required(),
});

// Schema for POST /api/v1/auth/request-password-reset
const requestPasswordResetSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is required.',
    }),
});

// Schema for POST /api/v1/auth/reset-password
const resetPasswordSchema = Joi.object({
    token: Joi.string().required().messages({
        'any.required': 'Reset token is required.',
    }),
    newPassword: Joi.string().min(AUTH.PASSWORD_MIN_LENGTH).required().messages({
        'string.min': `Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters long.`,
        'any.required': 'New password is required.',
    }),
});

// Schema for POST /api/v1/auth/resend-verification
const resendVerificationSchema = Joi.object({
    tckn: Joi.string().length(VALIDATION.TCKN_LENGTH).pattern(/^[0-9]+$/).required().messages({
        'string.length': `TCKN must be ${VALIDATION.TCKN_LENGTH} digits.`,
        'string.pattern.base': 'TCKN must only contain digits.',
        'any.required': 'TCKN is required.',
    }),
    email: Joi.string().email().optional().messages({
        'string.email': 'Please provide a valid email address.',
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    personnelRegisterSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    resendVerificationSchema,
};
