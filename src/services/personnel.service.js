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
 * Delete personnel with cascading deletes
 * Deletes in order: appointments -> leave requests -> doctor/admin profile -> user
 */
const deletePersonnel = async (personnelId) => {
    const id = parseInt(personnelId);

    await prisma.$transaction([
        // 1. Delete appointments linked to this doctor
        prisma.appointment.deleteMany({
            where: { doctor: { userId: id } }
        }),

        // 2. Delete leave requests linked to this doctor
        prisma.leaveRequest.deleteMany({
            where: { doctor: { userId: id } }
        }),

        // 3. Delete doctor profile (if exists)
        prisma.doctor.deleteMany({
            where: { userId: id }
        }),

        // 4. Delete admin profile (if exists)
        prisma.admin.deleteMany({
            where: { userId: id }
        }),

        // 5. Finally delete the user record
        prisma.user.delete({
            where: { id: id },
        })
    ]);

    return { id: id };
};

module.exports = {
    getAllPersonnel,
    updatePersonnel,
    deletePersonnel,
};
