const Joi = require('joi');

/**
 * Validation schema for medical file upload
 */
const uploadMedicalFileSchema = Joi.object({
    patientId: Joi.number().integer().positive().required().messages({
        'number.base': 'Patient ID must be a number.',
        'number.positive': 'Patient ID must be positive.',
        'any.required': 'Patient ID is required.',
    }),

    testName: Joi.string().min(2).max(100).required().messages({
        'string.base': 'Test name must be a string.',
        'string.min': 'Test name must be at least 2 characters.',
        'string.max': 'Test name cannot exceed 100 characters.',
        'any.required': 'Test name is required.',
    }),

    testDate: Joi.date().iso().max('now').required().messages({
        'date.base': 'Test date must be a valid date.',
        'date.format': 'Test date must be in YYYY-MM-DD format.',
        'date.max': 'Test date cannot be in the future.',
        'any.required': 'Test date is required.',
    }),

    description: Joi.string().max(500).optional().allow('').messages({
        'string.max': 'Description cannot exceed 500 characters.',
    }),
    requestId: Joi.number().integer().optional(),
});

module.exports = {
    uploadMedicalFileSchema,
};
