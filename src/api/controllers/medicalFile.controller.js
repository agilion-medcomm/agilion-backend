const medicalFileService = require('../../services/medicalFile.service');

/**
 * POST /api/v1/medical-files
 * Upload a medical file (Laborant only)
 */
const uploadMedicalFile = async (req, res, next) => {
    try {
        // Check if laborantId exists in token
        if (!req.user.laborantId) {
            return res.status(403).json({
                status: 'error',
                message: 'Only laborants can upload medical files.',
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'File is required.',
            });
        }

        const medicalFile = await medicalFileService.uploadMedicalFile(
            req.user.laborantId,
            req.body,
            req.file
        );

        res.status(201).json({
            status: 'success',
            message: 'Medical file uploaded successfully.',
            data: medicalFile,
        });
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

        res.status(200).json({
            status: 'success',
            data: files,
        });
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
        const patientId = parseInt(req.params.patientId);
        if (isNaN(patientId) || patientId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid patient ID.',
            });
        }
        const files = await medicalFileService.getPatientMedicalFiles(patientId);

        res.status(200).json({
            status: 'success',
            data: files,
        });
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
        const fileId = parseInt(req.params.fileId);
        if (isNaN(fileId) || fileId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid file ID.',
            });
        }
        const file = await medicalFileService.getMedicalFileById(
            fileId,
            req.user.userId,
            req.user.role
        );

        res.status(200).json({
            status: 'success',
            data: file,
        });
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
        const laborantId = parseInt(req.params.laborantId);
        if (isNaN(laborantId) || laborantId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid laborant ID.',
            });
        }
        const files = await medicalFileService.getLaborantMedicalFiles(laborantId);

        res.status(200).json({
            status: 'success',
            data: files,
        });
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
        const fileId = parseInt(req.params.fileId);
        if (isNaN(fileId) || fileId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid file ID.',
            });
        }
        const result = await medicalFileService.deleteMedicalFile(
            fileId,
            req.user.userId,
            req.user.role
        );

        res.status(200).json({
            status: 'success',
            message: result.message,
        });
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
        const fileId = parseInt(req.params.fileId);
        if (isNaN(fileId) || fileId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid file ID.',
            });
        }

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
            return res.status(403).json({
                status: 'error',
                message: 'Only laborants can access this endpoint.',
            });
        }

        const files = await medicalFileService.getMyUploads(req.user.userId);

        res.status(200).json({
            status: 'success',
            data: files,
        });
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
