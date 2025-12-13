const Joi = require('joi');
const { AUTH } = require('../../config/constants');

const updateProfileSchema = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    email: Joi.string().email(),

    phoneNumber: Joi.string().pattern(/^\+?[0-9\s]+$/), 
    address: Joi.string(),
    emergencyContact: Joi.string(),

    dateOfBirth: Joi.date().iso(),

    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    
    newPassword: Joi.string()
        .min(AUTH.PASSWORD_MIN_LENGTH)
        .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9])')) // At least 1 letter and 1 number
        .required()
        .messages({
            'string.min': `Yeni şifre en az ${AUTH.PASSWORD_MIN_LENGTH} karakter olmalıdır.`,
            'string.pattern.base': 'Yeni şifre en az bir harf ve bir sayı içermelidir.'
        }),

    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword')) // Must match newPassword
        .required()
        .messages({
            'any.only': 'Şifreler eşleşmiyor.'
        })
});

module.exports = {
    updateProfileSchema,
    changePasswordSchema
};