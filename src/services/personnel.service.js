const prisma = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Get all personnel (doctors and admins) with formatted data
 */
const getAllPersonnel = async () => {
    const [doctors, admins] = await Promise.all([
        prisma.doctor.findMany({
            include: { user: true },
        }),
        prisma.admin.findMany({
            include: { user: true },
        }),
    ]);

    const personnel = [
        ...doctors.map(d => ({
            id: d.user.id,
            tckn: d.user.tckn,
            firstName: d.user.firstName,
            lastName: d.user.lastName,
            email: d.user.email,
            phoneNumber: d.user.phoneNumber,
            role: d.user.role,
            specialization: d.specialization,
            dateOfBirth: d.user.dateOfBirth,
        })),
        ...admins.map(a => ({
            id: a.user.id,
            tckn: a.user.tckn,
            firstName: a.user.firstName,
            lastName: a.user.lastName,
            email: a.user.email,
            phoneNumber: a.user.phoneNumber,
            role: a.user.role,
            dateOfBirth: a.user.dateOfBirth,
        })),
    ];

    return personnel;
};

/**
 * Update personnel details
 */
const updatePersonnel = async (personnelId, updates) => {
    // Hash password if provided
    if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
    }

    const user = await prisma.user.update({
        where: { id: parseInt(personnelId) },
        data: updates,
    });

    // Remove password from response
    const { password, ...userWithoutPass } = user;

    return userWithoutPass;
};

/**
 * Delete personnel
 */
const deletePersonnel = async (personnelId) => {
    await prisma.user.delete({
        where: { id: parseInt(personnelId) },
    });

    return { id: parseInt(personnelId) };
};

module.exports = {
    getAllPersonnel,
    updatePersonnel,
    deletePersonnel,
};
