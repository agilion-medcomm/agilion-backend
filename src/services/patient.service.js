const prisma = require('../config/db');
const bcrypt = require('bcryptjs'); 

const { ApiError } = require('../api/middlewares/errorHandler');
const { isoDateToObject } = require('../utils/dateTimeValidator');

const changePassword = async (userId, currentPassword, newPassword) => {

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new ApiError(404, 'Kullanıcı bulunamadı.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new ApiError(401, 'Mevcut şifre hatalı.');
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
        throw new ApiError(400, 'Yeni şifre mevcut şifre ile aynı olamaz.'); // 422 de kullanılabilir
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);


    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    return true; 
};

module.exports = {
    changePassword
};

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
        patientId: pat.id,
        tckn: pat.user.tckn,
        firstName: pat.user.firstName,
        lastName: pat.user.lastName,
        email: pat.user.email,
        phoneNumber: pat.user.phoneNumber,
        dateOfBirth: pat.user.dateOfBirth,
        role: 'PATIENT',
    }));
};

const updateProfile = async (userId, updateData) => {

    const { 
        firstName, 
        lastName, 
        phoneNumber, 
        email,
        dateOfBirth,
        address, 
        emergencyContact, 
        bloodType 
    } = updateData;

    // Prepare user update data
    const userUpdateData = {};
    if (firstName) userUpdateData.firstName = firstName;
    if (lastName) userUpdateData.lastName = lastName;
    if (phoneNumber) userUpdateData.phoneNumber = phoneNumber;
    if (dateOfBirth) userUpdateData.dateOfBirth = isoDateToObject(dateOfBirth);
    if (email)
    {
        const existingUser = await prisma.user.findUnique({ where: { email }})
        if (existingUser && existingUser.id !== userId)
        {
            throw new ApiError(409, "A user with this email already exists");
        }
        userUpdateData.email = email;
    }

    // Prepare patient update data
    const patientUpdateData = {};
    if (address !== undefined) patientUpdateData.address = address;
    if (emergencyContact !== undefined) patientUpdateData.emergencyContact = emergencyContact;
    if (bloodType !== undefined) patientUpdateData.bloodType = bloodType;

    if (Object.keys(userUpdateData).length > 0) {
        patientUpdateData.user = { update: userUpdateData };
    }

    const updatedPatient = await prisma.patient.update({
        where: { userId: userId },
        data: patientUpdateData,
        include: {
            user: true 
        }
    });

    return updatedPatient;
};

/**
 * Get patient by TCKN (for cashier/admin/doctor search)
 */
const getPatientByTCKN = async (tckn) => {
    const user = await prisma.user.findUnique({
        where: { tckn },
        include: {
            patient: true,
        },
    });

    if (!user || !user.patient) {
        throw new ApiError(404, 'Patient not found.');
    }

    return {
        patientId: user.patient.id,
        firstName: user.firstName,
        lastName: user.lastName,
    };
};

module.exports = {
    getAllPatients,
    changePassword,
    updateProfile,
    getPatientByTCKN,
};
