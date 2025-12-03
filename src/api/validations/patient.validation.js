const Joi = require('joi');

const updateProfileSchema = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),

    phoneNumber: Joi.string().pattern(/^\+?[0-9\s]+$/), 
    address: Joi.string(),
    emergencyContact: Joi.string(),

    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    
    newPassword: Joi.string()
        .min(6)
        .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9])')) // En az 1 harf ve 1 sayı
        .required()
        .messages({
            'string.min': 'Yeni şifre en az 6 karakter olmalıdır.',
            'string.pattern.base': 'Yeni şifre en az bir harf ve bir sayı içermelidir.'
        }),

    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword')) // newPassword ile aynısı olmalı
        .required()
        .messages({
            'any.only': 'Şifreler eşleşmiyor.'
        })
});

module.exports = {
    updateProfileSchema,
    changePasswordSchema
};