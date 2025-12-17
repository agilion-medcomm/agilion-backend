const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const { ROLES } = require('../config/constants');
const { ApiError } = require('../api/middlewares/errorHandler');

/**
 * Map personnel user data to consistent format
 */
const mapPersonnelUser = (user, specialization = null) => ({
    id: user.id,
    tckn: user.tckn,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    dateOfBirth: user.dateOfBirth,
    photoUrl: user.profilePhoto,
    ...(specialization && { specialization }),
});

/**
 * Get all personnel (doctors, admins, cashiers, laborants, and cleaners) with formatted data
 */
const getAllPersonnel = async () => {
    const [doctors, admins, cashiers, laborants, cleaners] = await Promise.all([
        prisma.doctor.findMany({ include: { user: true } }),
        prisma.admin.findMany({ include: { user: true } }),
        prisma.user.findMany({ where: { role: ROLES.CASHIER } }),
        prisma.laborant.findMany({ include: { user: true } }),
        prisma.cleaner.findMany({ include: { user: true } }),
    ]);

    return [
        ...doctors.map(d => mapPersonnelUser(d.user, d.specialization)),
        ...admins.map(a => mapPersonnelUser(a.user)),
        ...cashiers.map(c => mapPersonnelUser(c)),
        ...laborants.map(l => mapPersonnelUser(l.user)),
        ...cleaners.map(cl => mapPersonnelUser(cl.user)),
    ];
};

/**
 * Update personnel details
 */
const updatePersonnel = async (personnelId, updates) => {
    const userId = parseInt(personnelId);
    
    // Separate user fields from doctor-specific fields
    const { specialization, currentPassword, newPassword, ...userUpdates } = updates;
    
    // Handle password change with current password verification
    if (newPassword) {
        if (!currentPassword) {
            throw new ApiError(400, 'Current password is required to change password.');
        }
        
        // Get user to verify current password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true }
        });
        
        if (!user) {
            throw new ApiError(404, 'User not found.');
        }
        
        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new ApiError(401, 'Current password is incorrect.');
        }
        
        // Hash and set new password
        userUpdates.password = await hashPassword(newPassword);
    } else if (userUpdates.password) {
        // Direct password update (admin use case)
        userUpdates.password = await hashPassword(userUpdates.password);
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
 * Deletes in order: appointments -> leave requests -> doctor/admin/laborant profile -> user
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

        // 5. Delete laborant profile (if exists)
        prisma.laborant.deleteMany({
            where: { userId: id }
        }),

        // 6. Finally delete the user record
        prisma.user.delete({
            where: { id: id },
        })
    ]);

    return { id: id };
};

/**
 * Update personnel photo
 */
const updatePersonnelPhoto = async (userId, photoUrl) => {
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePhoto: photoUrl },
    });

    return {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        photoUrl: updatedUser.profilePhoto,
        role: updatedUser.role,
    };
};

module.exports = {
    getAllPersonnel,
    updatePersonnel,
    deletePersonnel,
    updatePersonnelPhoto,
};
