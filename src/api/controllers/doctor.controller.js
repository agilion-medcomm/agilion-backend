const doctorService = require('../../services/doctor.service');

/**
 * GET /api/v1/doctors
 * Public endpoint - get all doctors with basic info
 */
const getDoctors = async (req, res, next) => {
    try {
        const doctors = await doctorService.getAllDoctors();
        res.json({ data: doctors });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDoctors,
};
