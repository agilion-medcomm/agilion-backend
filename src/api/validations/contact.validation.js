const Joi = require('joi');
const { VALIDATION } = require('../../config/constants');

// Schema for POST /api/v1/contact (submit contact form)
const submitIssueSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Name is required.',
        'string.empty': 'Name is required.',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format.',
        'any.required': 'Email is required.',
        'string.empty': 'Email is required.',
    }),
    phone: Joi.string()
        .pattern(VALIDATION.PHONE_PATTERN)
        .required()
        .messages({
            'string.pattern.base': 'Phone number must be in format 5XXXXXXXXX (10 digits).',
            'any.required': 'Phone is required.',
            'string.empty': 'Phone is required.',
        }),
    subject: Joi.string().required().messages({
        'any.required': 'Subject is required.',
        'string.empty': 'Subject is required.',
    }),
    message: Joi.string().required().messages({
        'any.required': 'Message is required.',
        'string.empty': 'Message is required.',
    }),
});

// Schema for POST /api/v1/contact/:id/reply (reply to contact issue)
const replyToIssueSchema = Joi.object({
    replyMessage: Joi.string().required().messages({
        'any.required': 'Reply message is required.',
        'string.empty': 'Reply message is required.',
    }),
});

module.exports = {
    submitIssueSchema,
    replyToIssueSchema,
};
