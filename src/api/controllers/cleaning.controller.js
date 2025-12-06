const cleaningService = require('../../services/cleaning.service');

/**
 * POST /api/v1/cleaning
 * Create a new cleaning record with photo upload
 */
const createCleaningRecord = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { area, time } = req.body;
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // Validate that photo is provided
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'Photo is required for cleaning record.',
            });
        }

        const cleaningRecord = await cleaningService.createCleaningRecord(
            userId,
            area,
            time,
            photoUrl
        );

        res.status(201).json({
            status: 'success',
            data: cleaningRecord,
            message: 'Cleaning record created successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/cleaning
 * Get cleaning records with optional filters (date, area, personnelId)
 */
const getCleaningRecords = async (req, res, next) => {
    try {
        const { date, area, personnelId } = req.query;
        const filters = {};

        if (date) filters.date = date;
        if (area) filters.area = area;
        if (personnelId) filters.personnelId = parseInt(personnelId, 10);

        const records = await cleaningService.getAllCleaningRecords(filters);

        res.status(200).json({
            status: 'success',
            data: records,
            message: 'Cleaning records retrieved successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/cleaning/date/:date
 * Get cleaning records for a specific date
 */
const getCleaningRecordsByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        const records = await cleaningService.getCleaningRecordsByDate(date);

        res.status(200).json({
            status: 'success',
            data: records,
            message: 'Cleaning records for the date retrieved successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/cleaning/personnel/:personnelId
 * Get cleaning records for a specific personnel member
 */
const getCleaningRecordsByPersonnel = async (req, res, next) => {
    try {
        const { personnelId } = req.params;
        const { date } = req.query;

        const records = await cleaningService.getCleaningRecordsByPersonnel(
            parseInt(personnelId, 10),
            date || undefined
        );

        res.status(200).json({
            status: 'success',
            data: records,
            message: 'Cleaning records for the personnel retrieved successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/cleaning/:recordId
 * Delete a cleaning record (only by the personnel who created it)
 */
const deleteCleaningRecord = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { recordId } = req.params;

        const result = await cleaningService.deleteCleaningRecord(
            parseInt(recordId, 10),
            userId
        );

        res.status(200).json({
            status: 'success',
            data: result,
            message: 'Cleaning record deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCleaningRecord,
    getCleaningRecords,
    getCleaningRecordsByDate,
    getCleaningRecordsByPersonnel,
    deleteCleaningRecord,
};
