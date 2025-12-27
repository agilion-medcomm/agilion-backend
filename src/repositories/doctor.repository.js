const prisma = require('../config/db.js');

/**
 * Get all doctors with their user information
 */
const getAllDoctors = async (whereClause = {}) => {
    return prisma.doctor.findMany({
        where: whereClause,
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
};

/**
 * Get doctor by ID with user information
 */
const getDoctorById = async (id) => {
    return prisma.doctor.findUnique({
        where: { id: parseInt(id) },
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
};

/**
 * Update doctor's rating statistics
 */
const updateDoctorRatings = async (doctorId, averageRating, totalRatings) => {
    return prisma.doctor.update({
        where: { id: parseInt(doctorId) },
        data: {
            averageRating: averageRating,
            totalRatings: totalRatings,
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
};

/**
 * Update doctor's profile information
 */
const updateDoctorProfile = async (doctorId, profileData) => {
    const { biography, expertiseAreas, educationAndAchievements, workPrinciples } = profileData;

    return prisma.doctor.update({
        where: { id: parseInt(doctorId) },
        data: {
            ...(biography !== undefined && { biography }),
            ...(expertiseAreas !== undefined && { expertiseAreas }),
            ...(educationAndAchievements !== undefined && { educationAndAchievements }),
            ...(workPrinciples !== undefined && { workPrinciples }),
        },
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
};

module.exports = {
    getAllDoctors,
    getDoctorById,
    updateDoctorRatings,
    updateDoctorProfile,
};

