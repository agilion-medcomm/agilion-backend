const doctorService = require('../../services/doctor.service');
const { sendSuccess } = require('../../utils/responseFormatter');
const prisma = require('../../config/db');
const { ApiError } = require('../middlewares/errorHandler');

const { SPECIALTY_LABELS } = require('../../config/constants');

/**
 * GET /api/v1/doctors
 * GET /api/v1/doctors?specialization=...
 * Public endpoint - get all doctors with basic info
 * Query params: specialization (optional filter by department/specialty)
 */
const getDoctors = async (req, res, next) => {
    try {
        let { specialization } = req.query;

        // Map display label (e.g., "Dermatoloji") to Enum key (e.g., "DERMATOLOGY")
        if (specialization) {
            const entry = Object.entries(SPECIALTY_LABELS).find(([key, label]) => label === specialization);
            if (entry) {
                specialization = entry[0];
            }
        }

        const doctors = await doctorService.getAllDoctors(specialization);
        sendSuccess(res, doctors);
    } catch (error) {
        next(error);
    }
};


/**
 * PUT /api/v1/doctors/:id/profile
 * Update doctor profile information
 * Authenticated endpoint - only the doctor themselves or admin can update
 * :id is User ID (frontend sends User ID)
 */
const updateDoctorProfile = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id);  // Frontend sends User ID
        const { biography, expertiseAreas, educationAndAchievements, workPrinciples } = req.body;

        // Convert User ID to Doctor ID
        const doctor = await prisma.doctor.findUnique({
            where: { userId: userId }
        });

        if (!doctor) {
            return next(new ApiError(404, 'Doctor not found for this user.'));
        }

        // Update doctor profile using Doctor ID
        const updatedDoctor = await doctorService.updateDoctorProfile(doctor.id, {
            biography,
            expertiseAreas,
            educationAndAchievements,
            workPrinciples,
        });

        sendSuccess(res, updatedDoctor);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/doctors/:id/availability
 * Update doctor availability protocol
 */
const updateDoctorAvailability = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id);
        const { availabilityProtocol } = req.body;

        const doctor = await prisma.doctor.findUnique({
            where: { userId: userId }
        });

        if (!doctor) {
            return next(new ApiError(404, 'Doctor not found for this user.'));
        }

        const updated = await doctorService.updateDoctorAvailability(doctor.id, availabilityProtocol);

        sendSuccess(res, updated);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDoctors,
    updateDoctorProfile,
    updateDoctorAvailability,
};
