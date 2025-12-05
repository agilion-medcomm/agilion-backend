const doctorService = require('../../services/doctor.service');

/**
 * GET /api/v1/doctors
 * GET /api/v1/doctors?department=...
 * Public endpoint - get all doctors with basic info
 * Query params: department (optional filter)
 */
const getDoctors = async (req, res, next) => {
    try {
        const { department } = req.query;
        const doctors = await doctorService.getAllDoctors(department);
        res.json({ data: doctors });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDoctors,
};
