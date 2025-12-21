const Joi = require('joi');

const createLabRequestSchema = Joi.object({
    patientId: Joi.number().integer().required(),
    fileTitle: Joi.string().min(1).required(),
    notes: Joi.string().allow(null),
    assigneeLaborantId: Joi.number().integer().allow('', null).optional(),
});

const assignLabRequestSchema = Joi.object({
    assigneeLaborantId: Joi.alternatives().try(Joi.number().integer(), Joi.string().pattern(/^\d+$/)).required(),
});

module.exports = {
    createLabRequestSchema,
    assignLabRequestSchema,
};
