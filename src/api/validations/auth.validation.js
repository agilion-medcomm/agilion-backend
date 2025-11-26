const Joi = require('joi');

// Schema for POST /api/v1/auth/register
const registerSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    tckn: Joi.string().length(11).pattern(/^[0-9]+$/).required().messages({
        'string.length': 'TCKN must be 11 digits.',
        'string.pattern.base': 'TCKN must only contain digits.',
    }),
    role: Joi.string().valid('PATIENT', 'DOCTOR', 'ADMIN'),
    // Enforce format AND real calendar date (no 2025-13-40)
    dateOfBirth: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .required()
        .custom((value, helpers) => {
            // Basic format already ensured by pattern; now validate calendar correctness
            const [y, m, d] = value.split('-').map(Number);
            const date = new Date(Date.UTC(y, m - 1, d));
            const isValid =
                date.getUTCFullYear() === y &&
                date.getUTCMonth() === (m - 1) &&
                date.getUTCDate() === d;

            if (!isValid) {
                return helpers.error('any.invalid');
            }
            return value;
        }, 'Calendar date validation')
        .messages({
            'string.pattern.base': 'Invalid date format. Use YYYY-MM-DD.',
            'any.invalid': 'Invalid date format. Use YYYY-MM-DD.',
        }),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    password: Joi.string().min(8).required(),
});

// Schema for POST /api/v1/auth/login
const loginSchema = Joi.object({
    tckn: Joi.string().length(11).required(),
    password: Joi.string().required(),
});

const personnelRegisterSchema = Joi.object({
    token: Joi.string().required(), // admin JWT, validated in service
    tckn: Joi.string().length(11).pattern(/^[0-9]+$/).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    password: Joi.string().min(8).required(),
    // Allow ADMIN and DOCTOR for now; easy to extend with new roles later.
    role: Joi.string().valid('DOCTOR', 'ADMIN').required(),
    phoneNumber: Joi.string().allow('').optional(),
    email: Joi.string().email().allow('').optional(),
    dateOfBirth: Joi.alternatives().try(
        Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
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
    newPassword: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long.',
        'any.required': 'New password is required.',
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    personnelRegisterSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
};
