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

module.exports = {
    getPatients,
};
