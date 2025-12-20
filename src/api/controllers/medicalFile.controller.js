const medicalFileService = require('../../services/medicalFile.service');
const { parseAndValidateId } = require('../../utils/idValidator');
const { sendSuccess, sendCreated, sendError } = require('../../utils/responseFormatter');

/**
 * POST /api/v1/medical-files
 * Upload a medical file (Laborant only)
 */
const uploadMedicalFile = async (req, res, next) => {
    try {
        // Check if laborantId exists in token
        if (!req.user.laborantId) {
            return sendError(res, 'Only laborants can upload medical files.', 403);
        }

        // Check if file was uploaded
        if (!req.file) {
            return sendError(res, 'File is required.', 400);
        }

        const medicalFile = await medicalFileService.uploadMedicalFile(
            req.user.laborantId,
            req.body,
            req.file
        );

        sendCreated(res, medicalFile, 'Medical file uploaded successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/medical-files/my
 * Get medical files for the authenticated patient
 */
const getMyMedicalFiles = async (req, res, next) => {
    try {
        const files = await medicalFileService.getMyMedicalFiles(req.user.userId);

        sendSuccess(res, files);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/medical-files/patient/:patientId
 * Get medical files for a specific patient (Doctor/Admin)
 */
const getPatientMedicalFiles = async (req, res, next) => {
    try {
        const patientId = parseAndValidateId(req.params.patientId, 'patient ID');
        const files = await medicalFileService.getPatientMedicalFiles(patientId);

        sendSuccess(res, files);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/medical-files/:fileId
 * Get a single medical file by ID
 */
const getMedicalFileById = async (req, res, next) => {
    try {
        const fileId = parseAndValidateId(req.params.fileId, 'file ID');
        const file = await medicalFileService.getMedicalFileById(
            fileId,
            req.user.userId,
            req.user.role
        );

        sendSuccess(res, file);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/medical-files/laborant/:laborantId
 * Get files uploaded by a specific laborant (Admin only)
 */
const getLaborantMedicalFiles = async (req, res, next) => {
    try {
        const laborantId = parseAndValidateId(req.params.laborantId, 'laborant ID');
        const files = await medicalFileService.getLaborantMedicalFiles(laborantId);

        sendSuccess(res, files);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/medical-files
 * Admin: list all medical files with optional query params
 * Query params: includeDeleted=true|false, includeOrphaned=true|false
 */
const listAllMedicalFiles = async (req, res, next) => {
    try {
        // Only admin can call this route (route-level middleware should ensure that)
        const includeDeleted = req.query.includeDeleted === 'true';
        const includeOrphaned = req.query.includeOrphaned === 'true';

        const files = await medicalFileService.getAllMedicalFiles({ includeDeleted, includeOrphaned });
        sendSuccess(res, files);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/medical-files/:fileId
 * Delete a medical file
 */
const deleteMedicalFile = async (req, res, next) => {
    try {
        const fileId = parseAndValidateId(req.params.fileId, 'file ID');
        const result = await medicalFileService.deleteMedicalFile(
            fileId,
            req.user.userId,
            req.user.role
        );

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/medical-files/:fileId/download
 * Download a medical file (protected - requires authentication)
 */
const downloadMedicalFile = async (req, res, next) => {
    try {
        const fileId = parseAndValidateId(req.params.fileId, 'file ID');

        const fileData = await medicalFileService.getFileForDownload(
            fileId,
            req.user.userId,
            req.user.role
        );

        // Set appropriate headers for file download
        res.setHeader('Content-Type', fileData.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileData.fileName}"`);
        
        // Stream the file
        const fs = require('fs');
        const fileStream = fs.createReadStream(fileData.path);
        fileStream.pipe(res);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/medical-files/my-uploads
 * Get files uploaded by the authenticated laborant
 */
const getMyUploads = async (req, res, next) => {
    try {
        if (!req.user.laborantId) {
            return sendError(res, 'Only laborants can access this endpoint.', 403);
        }

        const files = await medicalFileService.getMyUploads(req.user.userId);

        sendSuccess(res, files);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadMedicalFile,
    getMyMedicalFiles,
    getPatientMedicalFiles,
    getMedicalFileById,
    getLaborantMedicalFiles,
    deleteMedicalFile,
    downloadMedicalFile,
    getMyUploads,
};
