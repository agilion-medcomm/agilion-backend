const Joi = require('joi');
const { RATING } = require('../../config/constants');

const rateAppointmentSchema = Joi.object({
    rating: Joi.number()
        .integer()
        .min(RATING.MIN)
        .max(RATING.MAX)
        .required()
        .messages({
            'number.base': 'Değerlendirme bir sayı olmalıdır.',
            'number.integer': 'Değerlendirme tam sayı olmalıdır.',
            'number.min': `Değerlendirme en az ${RATING.MIN} olmalıdır.`,
            'number.max': `Değerlendirme en fazla ${RATING.MAX} olmalıdır.`,
            'any.required': 'Değerlendirme gereklidir.'
        })
});

module.exports = {
    rateAppointmentSchema
};

