const medicalFileRepository = require('../repositories/medicalFile.repository');
const { ApiError } = require('../api/middlewares/errorHandler');
const prisma = require('../config/db');
const fs = require('fs').promises;
const FileType = require('file-type');
const logger = require('../utils/logger');
const { FILE_UPLOAD, ROLES } = require('../config/constants');

/**
 * Safely delete file with error logging
 */
const safeDeleteFile = async (filePath) => {
    if (!filePath) return;
    await fs.unlink(filePath).catch((err) => {
        logger.fileOperationError('delete', filePath, err);
    });
};

/**
 * Validate file content using magic number (file signature) detection
 * This prevents attackers from uploading malicious files with fake extensions
 */
const validateFileContent = async (filePath) => {
    const fileTypeResult = await FileType.fromFile(filePath);
    
    // PDF files may not always be detected correctly by file-type
    // So we also check the first bytes manually for PDF signature
    if (!fileTypeResult) {
        const buffer = await fs.readFile(filePath, { encoding: null });
        const pdfSignature = buffer.slice(0, 4).toString('ascii');
        if (pdfSignature === '%PDF') {
            return { mime: 'application/pdf', ext: 'pdf' };
        }
        return null;
    }
    
    return fileTypeResult;
};

/**
 * Upload a medical file (Laborant only)
 */
const uploadMedicalFile = async (laborantId, fileData, uploadedFile) => {
    // Validate file content using magic number detection
    // This prevents malicious files with fake extensions
    const fileType = await validateFileContent(uploadedFile.path);
    if (!fileType || !FILE_UPLOAD.ALLOWED_MEDICAL_FILE_TYPES.includes(fileType.mime)) {
        // Delete the uploaded file since it's invalid
        await safeDeleteFile(uploadedFile.path);
        throw new ApiError(400, 'Invalid file content. File signature does not match allowed types (PDF, JPEG, PNG).');
    }

    // Verify patient exists
    const patientExists = await medicalFileRepository.checkPatientExists(fileData.patientId);
    if (!patientExists) {
        // Delete uploaded file if patient doesn't exist
        await safeDeleteFile(uploadedFile?.path);
        throw new ApiError(404, 'Patient not found.');
    }

    // Parse test date to ISO format
    const testDate = new Date(fileData.testDate);
    if (isNaN(testDate.getTime())) {
        throw new ApiError(400, 'Invalid test date format. Use YYYY-MM-DD.');
    }

    // Calculate file size in KB
    const fileSizeKB = uploadedFile.size / 1024;

    // Prepare data for database
    const medicalFileData = {
        patientId: parseInt(fileData.patientId),
        laborantId: parseInt(laborantId),
        fileName: uploadedFile.originalname,
        fileUrl: `/uploads/medical-files/${uploadedFile.filename}`, // Local path
        fileType: uploadedFile.mimetype,
        fileSizeKB: parseFloat(fileSizeKB.toFixed(2)),
        testName: fileData.testName,
        testDate: testDate,
        description: fileData.description || null,
    };

    // Save to database
    const medicalFile = await medicalFileRepository.createMedicalFile(medicalFileData);

    return medicalFile;
};

/**
 * Get medical files for a patient (for doctors/admins)
 */
const getPatientMedicalFiles = async (patientId) => {
    const patientExists = await medicalFileRepository.checkPatientExists(patientId);
    if (!patientExists) {
        throw new ApiError(404, 'Patient not found.');
    }

    const files = await medicalFileRepository.getFilesByPatientId(patientId);
    return files;
};

/**
 * Get medical files for the authenticated patient
 */
const getMyMedicalFiles = async (userId) => {
    // Find patient record from userId
    const patient = await prisma.patient.findUnique({
        where: { userId: parseInt(userId) },
    });

    if (!patient) {
        throw new ApiError(404, 'Patient record not found.');
    }

    const files = await medicalFileRepository.getFilesByPatientId(patient.id);
    return files;
};

/**
 * Get files uploaded by a specific laborant (Admin only)
 */
const getLaborantMedicalFiles = async (laborantId) => {
    const laborant = await prisma.laborant.findUnique({
        where: { id: parseInt(laborantId) },
    });

    if (!laborant) {
        throw new ApiError(404, 'Laborant not found.');
    }

    const files = await medicalFileRepository.getFilesByLaborantId(laborantId);
    return files;
};

/**
 * Get a single medical file by ID
 */
const getMedicalFileById = async (fileId, userId, userRole) => {
    const file = await medicalFileRepository.getFileById(fileId);
    
    if (!file || file.deletedAt) {
        throw new ApiError(404, 'Medical file not found.');
    }

    // Authorization check
    // ADMIN can view all files
    if (userRole === ROLES.ADMIN) {
        return file;
    }

    // DOCTOR can view all files (for their patients)
    if (userRole === ROLES.DOCTOR) {
        return file;
    }

    // PATIENT can only view their own files
    if (userRole === ROLES.PATIENT) {
        const patient = await prisma.patient.findUnique({
            where: { userId: parseInt(userId) },
        });

        if (!patient || patient.id !== file.patientId) {
            throw new ApiError(403, 'Access denied.');
        }
        return file;
    }

    // LABORANT can view files they uploaded
    if (userRole === ROLES.LABORANT) {
        const laborant = await prisma.laborant.findUnique({
            where: { userId: parseInt(userId) },
        });

        if (!laborant || laborant.id !== file.laborantId) {
            throw new ApiError(403, 'Access denied.');
        }
        return file;
    }

    throw new ApiError(403, 'Access denied.');
};

/**
 * Soft delete a medical file (tombstone method)
 * - LABORANT: can delete their own uploaded files (laborantId must match)
 * - ADMIN: can delete any file (including orphaned files with null laborantId)
 * 
 * Note: Files with null laborantId (orphaned) cannot be deleted by laborants,
 * only admins can delete these historical records.
 */
const deleteMedicalFile = async (fileId, userId, userRole) => {
    const file = await medicalFileRepository.getFileById(fileId);
    
    if (!file || file.deletedAt) {
        throw new ApiError(404, 'Medical file not found.');
    }

    // Authorization check
    let canDelete = false;

    if (userRole === ROLES.ADMIN) {
        // Admin can delete any file, including orphaned ones (laborantId = null)
        canDelete = true;
    } else if (userRole === ROLES.LABORANT) {
        // Laborant can only delete files they uploaded
        // Note: Orphaned files (laborantId = null) cannot be deleted by laborants
        if (file.laborantId === null) {
            canDelete = false;
        } else {
            const laborant = await prisma.laborant.findUnique({
                where: { userId: parseInt(userId) },
            });

            if (laborant && laborant.id === file.laborantId) {
                canDelete = true;
            }
        }
    }

    if (!canDelete) {
        throw new ApiError(403, 'Permission denied. Only the uploader or admin can delete this file.');
    }

    // Soft delete from database (set deletedAt timestamp)
    // Physical file is kept for audit/recovery purposes
    await medicalFileRepository.deleteFileById(fileId);

    return { message: 'Medical file deleted successfully.' };
};

/**
 * Get file path for download (with authorization check)
 * Uses the same authorization logic as getMedicalFileById
 */
const getFileForDownload = async (fileId, userId, userRole) => {
    // First, get the file with authorization check
    const file = await getMedicalFileById(fileId, userId, userRole);
    
    // Get the physical file path from the URL stored in database
    // fileUrl format: /uploads/medical-files/filename.ext
    const relativePath = file.fileUrl.replace('/uploads/', '');
    const path = require('path');
    const absolutePath = path.join(__dirname, '../uploads', relativePath);
    
    // Check if file exists on disk
    const fsSync = require('fs');
    if (!fsSync.existsSync(absolutePath)) {
        throw new ApiError(404, 'File not found on disk.');
    }
    
    return {
        path: absolutePath,
        fileName: file.fileName,
        mimeType: file.fileType,
    };
};

/**
 * Get files uploaded by the authenticated laborant
 */
const getMyUploads = async (userId) => {
    const laborant = await prisma.laborant.findUnique({
        where: { userId: parseInt(userId) },
    });

    if (!laborant) {
        throw new ApiError(404, 'Laborant record not found.');
    }

    const files = await medicalFileRepository.getFilesByLaborantId(laborant.id);
    return files;
};

module.exports = {
    uploadMedicalFile,
    getPatientMedicalFiles,
    getMyMedicalFiles,
    getLaborantMedicalFiles,
    getMedicalFileById,
    deleteMedicalFile,
    getFileForDownload,
    getMyUploads,
};
