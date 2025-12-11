const prisma = require('../config/db');
const { ROLES } = require('../config/constants');

/**
 * Get all doctors with formatted data
 * @param {string} department - Optional department filter (specialization)
 */
const getAllDoctors = async (department) => {
    const where = {};

    // If department filter is provided, filter by specialization
    if (department) {
        where.specialization = department;
    }

    const doctors = await prisma.doctor.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    tckn: true,
                    email: true,
                    phoneNumber: true,
                    profilePhoto: true,
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
        img: doc.user.profilePhoto || '',
        role: ROLES.DOCTOR,
    }));
};

module.exports = {
    getAllDoctors,
};
