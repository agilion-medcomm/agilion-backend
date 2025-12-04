const patientService = require('../../services/patient.service');
const prisma = require('../../config/db');


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

/**
 * PUT /api/v1/patients/me/change-password
 */
const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        await patientService.changePassword(userId, currentPassword, newPassword);

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        
        const updatedPatient = await patientService.updateProfile(userId, req.body);

        const responseData = {
            id: updatedPatient.user.id,
            firstName: updatedPatient.user.firstName,
            lastName: updatedPatient.user.lastName,
            email: updatedPatient.user.email,
            dateOfBirth: updatedPatient.user.dateOfBirth,
            phoneNumber: updatedPatient.user.phoneNumber,
            address: updatedPatient.address,
            emergencyContact: updatedPatient.emergencyContact,
            bloodType: updatedPatient.bloodType,
            updatedAt: new Date().toISOString()
        };

        res.status(200).json({
            success: true,
            data: responseData,
            message: "Profile updated successfully"
        });

    } catch (error) {
        next(error);
    }
};
/**
 * GET /api/v1/patients/search?tckn=...
 * Search patient by TCKN (for cashier/admin/doctor)
 */
const getPatientByTCKN = async (req, res, next) => {
    try {
        const { tckn } = req.query;

        if (!tckn) {
            return res.status(400).json({
                status: 'error',
                message: 'TCKN is required.',
            });
        }

        const patient = await patientService.getPatientByTCKN(tckn);

        res.json({
            status: 'success',
            data: patient,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPatients,
    updateProfile,
    changePassword,
    getPatientByTCKN,
};
