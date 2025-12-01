const prisma = require('../../config/db');

/**
 * GET /api/v1/patients
 * Get all patients (for doctor search functionality)
 */
const getPatients = async (req, res, next) => {
    try {
        const patients = await prisma.patient.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        tckn: true,
                        email: true,
                        phoneNumber: true,
                        dateOfBirth: true,
                    },
                },
            },
        });

        const formatted = patients.map(pat => ({
            id: pat.user.id,
            tckn: pat.user.tckn,
            firstName: pat.user.firstName,
            lastName: pat.user.lastName,
            email: pat.user.email,
            phoneNumber: pat.user.phoneNumber,
            dateOfBirth: pat.user.dateOfBirth,
            role: 'PATIENT',
        }));

        res.json({ users: formatted });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId; 

        const { firstName, lastName, phoneNumber, address, emergencyContact, bloodType } = req.body;

        const updatedPatient = await prisma.patient.update({
            where: { userId: userId }, // Uses the Unique Foreign Key
            data: {
                address,
                emergencyContact,
                bloodType,
                user: {
                    update: {
                        firstName,
                        lastName,
                        phoneNumber
                    }
                }
            },
            include: { user: true } // Return the User info too
        });

        // 4. Send Response matching Contract
        res.status(200).json({
            success: true,
            data: {
                id: updatedPatient.user.id,
                firstName: updatedPatient.user.firstName,
                lastName: updatedPatient.user.lastName,
                email: updatedPatient.user.email,
                phoneNumber: updatedPatient.user.phoneNumber,
                address: updatedPatient.address,
                emergencyContact: updatedPatient.emergencyContact,
                bloodType: updatedPatient.bloodType,
                updatedAt: new Date().toISOString()
            },
            message: "Profile updated successfully"
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPatients,
    updateProfile,
};
