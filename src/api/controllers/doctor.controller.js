const prisma = require('../../config/db');

/**
 * GET /api/v1/doctors
 * Public endpoint - get all doctors with basic info
 */
const getDoctors = async (req, res, next) => {
    try {
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

        const formatted = doctors.map(doc => ({
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

        res.json({ data: formatted });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDoctors,
};
