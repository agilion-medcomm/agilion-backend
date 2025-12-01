const prisma = require('../../config/db');
const { ApiError } = require('../../api/middlewares/errorHandler');

/**
 * User Profile Service
 * Handles user profile retrieval logic
 */

/**
 * Get current user profile by ID
 */
const getUserProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            tckn: true,
            email: true,
            phoneNumber: true,
            dateOfBirth: true,
            role: true,
            doctor: {
                select: {
                    id: true,
                    specialization: true,
                },
            },
            admin: {
                select: {
                    id: true,
                },
            },
            patient: {
                select: {
                    id: true,
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    // Format response based on role
    const response = {
        id: user.doctor?.id || user.admin?.id || user.patient?.id || user.id,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        tckn: user.tckn,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        role: user.role,
    };

    if (user.doctor) {
        response.specialization = user.doctor.specialization;
    }

    return response;
};

module.exports = {
    getUserProfile,
};
