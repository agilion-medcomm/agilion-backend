const doctorService = require('../../services/doctor.service');
const { sendSuccess } = require('../../utils/responseFormatter');

/**
 * GET /api/v1/doctors
 * GET /api/v1/doctors?specialization=...
 * Public endpoint - get all doctors with basic info
 * Query params: specialization (optional filter by department/specialty)
 */
const getDoctors = async (req, res, next) => {
    try {
        const { specialization } = req.query;
        const doctors = await doctorService.getAllDoctors(specialization);
        sendSuccess(res, doctors);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDoctors,
};
