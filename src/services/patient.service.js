const prisma = require('../config/db');

/**
 * Get all patients with formatted data
 */
const getAllPatients = async () => {
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

    return patients.map(pat => ({
        id: pat.user.id,
        tckn: pat.user.tckn,
        firstName: pat.user.firstName,
        lastName: pat.user.lastName,
        email: pat.user.email,
        phoneNumber: pat.user.phoneNumber,
        dateOfBirth: pat.user.dateOfBirth,
        role: 'PATIENT',
    }));
};

module.exports = {
    getAllPatients,
};
