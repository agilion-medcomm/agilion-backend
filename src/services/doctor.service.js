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
    }));
};

module.exports = {
    getAllDoctors,
};
