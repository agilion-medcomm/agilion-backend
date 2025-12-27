const doctorRepository = require('../repositories/doctor.repository');
const { ROLES } = require('../config/constants');

/**
 * Get all doctors with formatted data
 * @param {string} specialization - Optional specialization/department filter
 */
const getAllDoctors = async (specialization) => {
    const where = {};

    // If specialization filter is provided, filter by it
    if (specialization) {
        where.specialization = specialization;
    }

    const doctors = await doctorRepository.getAllDoctors(where);

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
        averageRating: doc.averageRating,
        totalRatings: doc.totalRatings,
        biography: doc.biography || '',
        expertiseAreas: doc.expertiseAreas || '',
        educationAndAchievements: doc.educationAndAchievements || '',
        workPrinciples: doc.workPrinciples || '',
    }));
};


/**
 * Update doctor profile information
 * @param {number} doctorId - Doctor ID
 * @param {object} profileData - Profile data to update
 */
const updateDoctorProfile = async (doctorId, profileData) => {
    const updatedDoctor = await doctorRepository.updateDoctorProfile(doctorId, profileData);

    return {
        id: updatedDoctor.id,
        userId: updatedDoctor.user.id,
        tckn: updatedDoctor.user.tckn,
        firstName: updatedDoctor.user.firstName,
        lastName: updatedDoctor.user.lastName,
        specialization: updatedDoctor.specialization,
        email: updatedDoctor.user.email,
        phoneNumber: updatedDoctor.user.phoneNumber,
        img: updatedDoctor.user.profilePhoto || '',
        role: ROLES.DOCTOR,
        averageRating: updatedDoctor.averageRating,
        totalRatings: updatedDoctor.totalRatings,
        biography: updatedDoctor.biography || '',
        expertiseAreas: updatedDoctor.expertiseAreas || '',
        educationAndAchievements: updatedDoctor.educationAndAchievements || '',
        workPrinciples: updatedDoctor.workPrinciples || '',
    };
};

module.exports = {
    getAllDoctors,
    updateDoctorProfile,
};
