const prisma = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Get all personnel (doctors, admins, and cashiers) with formatted data
 */
const getAllPersonnel = async () => {
    const [doctors, admins, cashiers] = await Promise.all([
        prisma.doctor.findMany({
            include: { user: true },
        }),
        prisma.admin.findMany({
            include: { user: true },
        }),
        prisma.user.findMany({
            where: { role: 'CASHIER' },
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
        ...cashiers.map(c => ({
            id: c.id,
            tckn: c.tckn,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phoneNumber: c.phoneNumber,
            role: c.role,
            dateOfBirth: c.dateOfBirth,
        })),
    ];

    return personnel;
};

/**
 * Update personnel details
 */
const updatePersonnel = async (personnelId, updates) => {
    const userId = parseInt(personnelId);
    
    // Separate user fields from doctor-specific fields
    const { specialization, ...userUpdates } = updates;
    
    // Hash password if provided
    if (userUpdates.password) {
        const salt = await bcrypt.genSalt(10);
        userUpdates.password = await bcrypt.hash(userUpdates.password, salt);
    }

    // Update user fields
    const user = await prisma.user.update({
        where: { id: userId },
        data: userUpdates,
    });

    // Update doctor specialization if provided
    if (specialization !== undefined) {
        const doctor = await prisma.doctor.findUnique({
            where: { userId: userId }
        });
        
        if (doctor) {
            await prisma.doctor.update({
                where: { id: doctor.id },
                data: { specialization }
            });
        }
    }

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
