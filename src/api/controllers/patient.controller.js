const patientService = require('../../services/patient.service');

/**
 * GET /api/v1/patients
 * Get all patients (for doctor search functionality)
 */
const getPatients = async (req, res, next) => {
    try {
        const patients = await patientService.getAllPatients();
        res.json({ users: patients });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPatients,
};
