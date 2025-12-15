const prisma = require('../config/db');
const { ApiError } = require('../api/middlewares/errorHandler');
const { ROLES } = require('../config/constants');

/**
 * Create a cleaning record
 */
const createCleaningRecord = async (userId, area, time, photoUrl) => {
    // Validate inputs
    if (!area || !time) {
        throw new ApiError(400, 'Area and time are required.');
    }

    // Get current date in YYYY-MM-DD format
    const date = new Date().toISOString().split('T')[0];

    // Get cleaner by userId
    const cleaner = await prisma.cleaner.findUnique({
        where: { userId },
    });

    if (!cleaner) {
        throw new ApiError(404, 'Cleaner profile not found.');
    }

    // Create the cleaning record
    const cleaningRecord = await prisma.cleaningRecord.create({
        data: {
            cleanerId: cleaner.id,
            area,
            time,
            photoUrl,
            date,
        },
        include: {
            cleaner: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });

    return cleaningRecord;
};

/**
 * Get cleaning records for a specific date
 */
const getCleaningRecordsByDate = async (date) => {
    // Validate date format (YYYY-MM-DD)
    const { VALIDATION } = require('../config/constants');
    if (!date || !VALIDATION.DATE_ISO_PATTERN.test(date)) {
        throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD.');
    }

    const records = await prisma.cleaningRecord.findMany({
        where: { date },
        include: {
            cleaner: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return records;
};

/**
 * Get cleaning records for a specific personnel
 */
const getCleaningRecordsByPersonnel = async (personnelId, date) => {
    // Get cleaner by userId (personnel)
    const cleaner = await prisma.cleaner.findUnique({
        where: { userId: personnelId },
    });

    if (!cleaner) {
        throw new ApiError(404, 'Cleaner profile not found.');
    }

    const whereClause = { cleanerId: cleaner.id };
    if (date) {
        whereClause.date = date;
    }

    const records = await prisma.cleaningRecord.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
    });

    return records;
};

/**
 * Get all cleaning records with optional filters
 */
const getAllCleaningRecords = async (filters = {}) => {
    try {
        const { date, area, personnelId } = filters;
        const whereClause = {};

        if (date) {
            whereClause.date = date;
        }
        if (area) {
            whereClause.area = area;
        }
        if (personnelId) {
            // Find cleaner by userId
            const cleaner = await prisma.cleaner.findUnique({
                where: { userId: personnelId },
            });
            if (cleaner) {
                whereClause.cleanerId = cleaner.id;
            }
        }

        const records = await prisma.cleaningRecord.findMany({
            where: whereClause,
            include: {
                cleaner: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return records;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a cleaning record
 */
const deleteCleaningRecord = async (recordId, userId) => {
    try {
        const record = await prisma.cleaningRecord.findUnique({
            where: { id: recordId },
            include: { cleaner: true },
        });

        if (!record) {
            throw new ApiError(404, 'Cleaning record not found.');
        }

        // Get user by userId, including role and cleaner profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { cleaner: true },
        });

        if (!user) {
            throw new ApiError(404, 'User not found.');
        }

        // Admins can delete any record
        if (user.role === ROLES.ADMIN) {
            // proceed to delete
        } else {
            // Cleaners can only delete their own records
            if (!user.cleaner) {
                throw new ApiError(404, 'Cleaner profile not found.');
            }
            if (record.cleanerId !== user.cleaner.id) {
                throw new ApiError(403, 'You are not authorized to delete this record.');
            }
        }

        await prisma.cleaningRecord.delete({
            where: { id: recordId },
        });

        return { success: true, message: 'Cleaning record deleted successfully.' };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createCleaningRecord,
    getCleaningRecordsByDate,
    getCleaningRecordsByPersonnel,
    getAllCleaningRecords,
    deleteCleaningRecord,
};
