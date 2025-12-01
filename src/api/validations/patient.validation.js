const Joi = require('joi');

const updateProfileSchema = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),

    phoneNumber: Joi.string().pattern(/^\+?[0-9\s]+$/), 
    address: Joi.string(),
    emergencyContact: Joi.string(),

    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
});

module.exports = {
    updateProfileSchema
};