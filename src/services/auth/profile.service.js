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
            profilePhoto: true,
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
            cleaner: {
                select: {
                    id: true,
                },
            },
            laborant: {
                select: {
                    id: true,
                },
            },
            patient: {
                select: {
                    id: true,
                    address: true,
                    emergencyContact: true,
                    bloodType: true,
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    // Format response based on role
    const response = {
        id: user.id, // Always return user ID as 'id'
        userId: user.id, // Keep for backward compatibility
        firstName: user.firstName,
        lastName: user.lastName,
        tckn: user.tckn,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        photoUrl: user.profilePhoto,
        role: user.role,
    };

    if (user.doctor) {
        response.profileId = user.doctor.id; // Profile ID for reference
        response.specialization = user.doctor.specialization;
    }

    if (user.admin) {
        response.profileId = user.admin.id; // Profile ID for reference
    }

    if (user.laborant) {
        response.profileId = user.laborant.id; // Profile ID for reference
    }

    if (user.cleaner) {
        response.profileId = user.cleaner.id; // Profile ID for reference
    }

    if (user.patient) {
        response.profileId = user.patient.id; // Profile ID for reference
        response.address = user.patient.address;
        response.emergencyContact = user.patient.emergencyContact;
        response.bloodType = user.patient.bloodType;
    }

    return response;
};

module.exports = {
    getUserProfile,
};
