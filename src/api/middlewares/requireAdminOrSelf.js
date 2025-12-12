const prisma = require('../../config/db');
const { ROLES } = require('../../config/constants');
const { ApiError } = require('./errorHandler');
const logger = require('../../utils/logger');

/**
 * Middleware to allow admin OR the user updating their own profile
 * Maps profile ID to User ID and checks authorization
 * Handles both profile IDs (doctor, admin, laborant, cleaner) and direct user IDs (cashier)
 * 
 * Must be used after authMiddleware
 */
const requireAdminOrSelf = async (req, res, next) => {
    const { id } = req.params; // This is a profile ID (or user ID for cashier)
    const requestingUser = req.user; // From JWT: { userId, role, tckn, doctorId?, adminId?, laborantId?, cleanerId? }
    
    try {
        let targetUserId = null;
        
        // Use the requesting user's role to determine which profile table to check
        // This is critical because profile IDs are NOT unique across tables
        // (e.g., Doctor ID 1 is different from Laborant ID 1)
        switch (requestingUser.role) {
            case ROLES.DOCTOR:
                const doctor = await prisma.doctor.findUnique({
                    where: { id: parseInt(id) },
                    select: { userId: true }
                });
                if (doctor) targetUserId = doctor.userId;
                break;
                
            case ROLES.ADMIN:
                const admin = await prisma.admin.findUnique({
                    where: { id: parseInt(id) },
                    select: { userId: true }
                });
                if (admin) targetUserId = admin.userId;
                break;
                
            case ROLES.LABORANT:
                const laborant = await prisma.laborant.findUnique({
                    where: { id: parseInt(id) },
                    select: { userId: true }
                });
                if (laborant) targetUserId = laborant.userId;
                break;
                
            case ROLES.CLEANER:
                const cleaner = await prisma.cleaner.findUnique({
                    where: { id: parseInt(id) },
                    select: { userId: true }
                });
                if (cleaner) targetUserId = cleaner.userId;
                break;
                
            case ROLES.CASHIER:
                // Cashiers don't have a separate profile table
                const user = await prisma.user.findUnique({
                    where: { id: parseInt(id) },
                    select: { id: true }
                });
                if (user) targetUserId = user.id;
                break;
                
            default:
                logger.warn(`requireAdminOrSelf: Unknown role ${requestingUser.role}`);
                return next(new ApiError(400, 'Invalid user role.'));
        }
        
        if (!targetUserId) {
            return next(new ApiError(404, 'Personnel not found.'));
        }
        
        // Attach the target user ID to the request for the controller to use
        req.targetUserId = targetUserId;
        
        // Allow if admin
        if (requestingUser.role === ROLES.ADMIN) {
            return next();
        }
        
        // Allow if user is updating their own profile
        if (requestingUser.userId === targetUserId) {
            return next();
        }
        
        return next(new ApiError(403, 'You can only update your own profile.'));
        
    } catch (error) {
        logger.error('Error in requireAdminOrSelf', error);
        return next(new ApiError(500, 'Error verifying user identity.'));
    }
};

module.exports = requireAdminOrSelf;
