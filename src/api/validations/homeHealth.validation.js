const Joi = require('joi');
const { joiTcknValidator } = require('../../utils/validators');
const { joiISODateValidator } = require('../../utils/dateTimeValidator');
const { VALIDATION } = require('../../config/constants');

/**
 * Schema for POST /api/v1/home-health (create home health request)
 */
const createRequestSchema = Joi.object({
    fullName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Full name must be at least 2 characters.',
            'string.max': 'Full name must not exceed 100 characters.',
            'any.required': 'Full name is required.',
            'string.empty': 'Full name is required.',
        }),
    
    tckn: Joi.string()
        .custom(joiTcknValidator)
        .required()
        .messages({
            'any.invalid': 'TCKN must be exactly 11 digits.',
            'any.required': 'TCKN is required.',
            'string.empty': 'TCKN is required.',
        }),
    
    phoneNumber: Joi.string()
        .pattern(VALIDATION.PHONE_PATTERN)
        .required()
        .messages({
            'string.pattern.base': 'Invalid phone number format.',
            'any.required': 'Phone number is required.',
            'string.empty': 'Phone number is required.',
        }),
    
    email: Joi.string()
        .email()
        .optional()
        .allow(null, '')
        .messages({
            'string.email': 'Invalid email format.',
        }),
    
    address: Joi.string()
        .min(10)
        .required()
        .messages({
            'string.min': 'Address must be at least 10 characters.',
            'any.required': 'Address is required.',
            'string.empty': 'Address is required.',
        }),
    
    serviceType: Joi.string()
        .required()
        .messages({
            'any.required': 'Service type is required.',
            'string.empty': 'Service type is required.',
        }),
    
    serviceDetails: Joi.string()
        .optional()
        .allow(null, ''),
    
    preferredDate: Joi.string()
        .custom(joiISODateValidator)
        .required()
        .custom((value, helpers) => {
            // Validate that date is in the future
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                return helpers.error('any.invalid');
            }
            
            return value;
        })
        .messages({
            'any.invalid': 'Preferred date must be today or a future date in YYYY-MM-DD format.',
            'any.required': 'Preferred date is required.',
            'string.empty': 'Preferred date is required.',
        }),
    
    preferredTime: Joi.string()
        .pattern(VALIDATION.TIME_PATTERN)
        .optional()
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Invalid time format. Expected HH:MM (e.g., 14:30).',
        }),
    
    notes: Joi.string()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Notes must not exceed 500 characters.',
        }),
});

/**
 * Schema for PATCH /api/v1/home-health/:id/approve and reject
 */
const approveRejectSchema = Joi.object({
    approvalNote: Joi.string()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Approval note must not exceed 500 characters.',
        }),
});

module.exports = {
    createRequestSchema,
    approveRejectSchema,
};

