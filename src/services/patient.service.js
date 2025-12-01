const prisma = require('../config/db');
const bcrypt = require('bcryptjs'); 

const { ApiError } = require('../api/middlewares/errorHandler');

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
        address, 
        emergencyContact, 
        bloodType 
    } = updateData;


    const updatedPatient = await prisma.patient.update({
        where: { userId: userId },
        data: {

            address,
            emergencyContact,
            bloodType,

            user: {
                update: {
                    firstName,
                    lastName,
                    phoneNumber
                }
            }
        },
        include: {
            user: true 
        }
    });

    return updatedPatient;
};

module.exports = {
    getAllPatients,
    changePassword,
    updateProfile
};
