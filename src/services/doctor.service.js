const prisma = require('../config/db');

/**
 * Get all doctors with formatted data
 */
const getAllDoctors = async () => {
    const doctors = await prisma.doctor.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    tckn: true,
                    email: true,
                    phoneNumber: true,
                },
            },
        },
    });

    return doctors.map(doc => ({
        id: doc.id,
        userId: doc.user.id,
        tckn: doc.user.tckn,
        firstName: doc.user.firstName,
        lastName: doc.user.lastName,
        specialization: doc.specialization,
        email: doc.user.email,
        phoneNumber: doc.user.phoneNumber,
        img: '', // Can add photo URL field later
        role: 'DOCTOR',
    }));
};

module.exports = {
    getAllDoctors,
};
