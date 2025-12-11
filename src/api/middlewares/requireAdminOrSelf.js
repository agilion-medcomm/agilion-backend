const prisma = require('../../config/db');
const { ROLES } = require('../../config/constants');
const { ApiError } = require('./errorHandler');
const logger = require('../../utils/logger');

/**
 * Middleware to allow admin OR the user updating their own profile
 * Maps Doctor/Admin/Laborant profile ID to User ID and checks authorization
 * 
 * Must be used after authMiddleware
 */
const requireAdminOrSelf = async (req, res, next) => {
    const { id } = req.params; // This is the Doctor/Admin/Laborant profile ID from the URL
    const requestingUser = req.user; // From JWT: { userId, role, tckn }
    
    try {
        // Find the user ID associated with this Doctor/Admin/Laborant profile ID
        let targetUserId = null;
        
        // Check if it's a doctor profile
        const doctor = await prisma.doctor.findUnique({
            where: { id: parseInt(id) },
            select: { userId: true }
        });
        
        if (doctor) {
            targetUserId = doctor.userId;
        } else {
            // Check if it's an admin profile
            const admin = await prisma.admin.findUnique({
                where: { id: parseInt(id) },
                select: { userId: true }
            });
            
            if (admin) {
                targetUserId = admin.userId;
            } else {
                // Check if it's a laborant profile
                const laborant = await prisma.laborant.findUnique({
                    where: { id: parseInt(id) },
                    select: { userId: true }
                });
                
                if (laborant) {
                    targetUserId = laborant.userId;
                } else {
                    // Check if it's a cleaner profile
                    const cleaner = await prisma.cleaner.findUnique({
                        where: { id: parseInt(id) },
                        select: { userId: true }
                    });
                    
                    if (cleaner) {
                        targetUserId = cleaner.userId;
                    }
                }
            }
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
