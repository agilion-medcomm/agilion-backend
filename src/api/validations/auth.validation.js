const Joi = require('joi');

// Schema for POST /api/v1/auth/register
const registerSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    tckn: Joi.string().length(11).pattern(/^[0-9]+$/).required().messages({
        'string.length': 'TCKN must be 11 digits.',
        'string.pattern.base': 'TCKN must only contain digits.',
    }),
    dateOfBirth: Joi.date().iso().required().messages({ // 'iso' is YYYY-MM-DD
        'date.format': 'Invalid date format. Use YYYY-MM-DD.',
    }),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).required(),
});

// Schema for POST /api/v1/auth/login
const loginSchema = Joi.object({
    tckn: Joi.string().length(11).required(),
    password: Joi.string().required(),
});

module.exports = {
    registerSchema,
    loginSchema,
};
