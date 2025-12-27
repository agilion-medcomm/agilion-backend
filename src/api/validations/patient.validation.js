const Joi = require('joi');
const { AUTH, BLOOD_TYPES, VALIDATION } = require('../../config/constants');

const updateProfileSchema = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    email: Joi.string().email(),

    phoneNumber: Joi.string()
        .pattern(VALIDATION.PHONE_PATTERN)
        .messages({
            'string.pattern.base': 'Phone number must be in format 5XXXXXXXXX (10 digits).',
        }),
    address: Joi.string(),
    emergencyContact: Joi.string(),

    dateOfBirth: Joi.date().iso(),

    bloodType: Joi.string().valid(...BLOOD_TYPES)
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