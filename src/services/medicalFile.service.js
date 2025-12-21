const medicalFileRepository = require('../repositories/medicalFile.repository');
const { ApiError } = require('../api/middlewares/errorHandler');
const prisma = require('../config/db');
const fs = require('fs').promises;
const FileType = require('file-type');
const logger = require('../utils/logger');
const { FILE_UPLOAD, ROLES, REQUEST_STATUS } = require('../config/constants');
const labRequestRepository = require('../repositories/labRequest.repository');

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
    const fileType = await validateFileContent(uploadedFile.path);
    if (!fileType || !FILE_UPLOAD.ALLOWED_MEDICAL_FILE_TYPES.includes(fileType.mime)) {
        await safeDeleteFile(uploadedFile.path);
        throw new ApiError(400, 'Invalid file content. File signature does not match allowed types (PDF, JPEG, PNG).');
    }

    // If a requestId is provided we derive patient and attach in a transaction
    if (fileData.requestId) {
        const requestId = parseInt(fileData.requestId);
        const reqRow = await labRequestRepository.findRequestById(requestId);
        if (!reqRow) {
            await safeDeleteFile(uploadedFile.path);
            throw new ApiError(404, 'Lab request not found.');
        }

        if (reqRow.status === REQUEST_STATUS.CANCELED) {
            await safeDeleteFile(uploadedFile.path);
            throw new ApiError(400, 'Cannot upload for a canceled request.');
        }

        if (reqRow.status === REQUEST_STATUS.COMPLETED) {
            await safeDeleteFile(uploadedFile.path);
            throw new ApiError(400, 'Request already completed.');
        }

        // Derive patient from request (do not trust client-provided patientId)
        const patientId = reqRow.patientId;

        // Parse testDate if provided, otherwise default to now
        let testDate = fileData.testDate ? new Date(fileData.testDate) : new Date();
        if (isNaN(testDate.getTime())) {
            await safeDeleteFile(uploadedFile.path);
            throw new ApiError(400, 'Invalid test date format. Use YYYY-MM-DD.');
        }

        const fileSizeKB = uploadedFile.size / 1024;

        // Use a transaction to create the file and attach it to the request atomically
        try {
            const createdFile = await prisma.$transaction(async (tx) => {
                const cf = await tx.medicalFile.create({
                    data: {
                        patientId: parseInt(patientId),
                        laborantId: parseInt(laborantId),
                        fileName: uploadedFile.originalname,
                        fileUrl: `/uploads/medical-files/${uploadedFile.filename}`,
                        fileType: uploadedFile.mimetype,
                        fileSizeKB: parseFloat((fileSizeKB).toFixed(2)),
                        testName: fileData.testName,
                        testDate: testDate,
                        description: fileData.description || null,
                        requestId: requestId,
                    }
                });

                // Link request side atomically: set medicalFileRequest.medicalFileId and complete the request
                await tx.medicalFileRequest.update({
                    where: { id: requestId },
                    data: { medicalFileId: cf.id, status: REQUEST_STATUS.COMPLETED, completedAt: new Date() }
                });

                return cf;
            });

            // Return a fully populated record (with relations) for consistency with repo
            const full = await medicalFileRepository.getFileById(createdFile.id);
            return full;
        } catch (err) {
            // On any failure, delete the uploaded file and bubble up a friendly error
            await safeDeleteFile(uploadedFile.path);
            logger.error('Failed to create and attach medical file for request', err);
            throw new ApiError(500, 'Failed to save medical file for request.');
        }
    }

    // Non-request flow: validate client-provided patient and test date
    const patientExists = await medicalFileRepository.checkPatientExists(fileData.patientId);
    if (!patientExists) {
        await safeDeleteFile(uploadedFile.path);
        throw new ApiError(404, 'Patient not found.');
    }

    const testDate = new Date(fileData.testDate);
    if (isNaN(testDate.getTime())) {
        await safeDeleteFile(uploadedFile.path);
        throw new ApiError(400, 'Invalid test date format. Use YYYY-MM-DD.');
    }

    const fileSizeKB = uploadedFile.size / 1024;

    const medicalFileData = {
        patientId: parseInt(fileData.patientId),
        laborantId: parseInt(laborantId),
        fileName: uploadedFile.originalname,
        fileUrl: `/uploads/medical-files/${uploadedFile.filename}`,
        fileType: uploadedFile.mimetype,
        fileSizeKB: parseFloat(fileSizeKB.toFixed(2)),
        testName: fileData.testName,
        testDate: testDate,
        description: fileData.description || null,
    };

    // Save to database
    try {
        const medicalFile = await medicalFileRepository.createMedicalFile(medicalFileData);
        return medicalFile;
    } catch (err) {
        if (err && err.code === 'P2002') {
            // Unique constraint failed (unlikely for files but map it)
            await safeDeleteFile(uploadedFile.path);
            throw new ApiError(400, 'Duplicate medical file record');
        }
        await safeDeleteFile(uploadedFile.path);
        throw err;
    }
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
 * Admin: get all medical files with optional query flags
 */
const getAllMedicalFiles = async (options = {}) => {
    // options: { includeDeleted: boolean, includeOrphaned: boolean }
    const files = await medicalFileRepository.getAllFiles(options);
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

    // If admin requested deletion => hard delete (permanent)
    if (userRole === ROLES.ADMIN) {
        // Attempt to remove physical file first when stored locally
        try {
            if (file.fileUrl && file.fileUrl.startsWith('/uploads/')) {
                const relativePath = file.fileUrl.replace(/^\//, '');
                const absolutePath = require('path').join(process.cwd(), relativePath);
                // remove file if exists
                await fs.unlink(absolutePath).catch((err) => {
                    // Log and continue; do not block DB deletion
                    logger.fileOperationError('unlink', absolutePath, err);
                });
            }
        } catch (e) {
            logger.error('Error while attempting to remove physical file during admin hard-delete', e);
        }

        // Permanently remove DB record
        await medicalFileRepository.hardDeleteFileById(fileId);
        return { message: 'Medical file permanently deleted by admin.' };
    }

    // Non-admin (laborant/doctor) => soft delete (tombstone). Admin is only one who can permanently remove
    await medicalFileRepository.deleteFileById(fileId);
    return { message: 'Medical file soft-deleted (hidden). Admins can still view or permanently delete it.' };
};

/**
 * Get file path for download (with authorization check)
 * Uses the same authorization logic as getMedicalFileById
 */
const getFileForDownload = async (fileId, userId, userRole) => {
    // First, get the file with authorization check
    const file = await getMedicalFileById(fileId, userId, userRole);
    
    // Get the physical file path from the URL stored in database
    // fileUrl format usually: /uploads/medical-files/filename.ext
    const path = require('path');
    const fsSync = require('fs');

    if (!file.fileUrl) {
        throw new ApiError(500, 'No fileUrl available for this medical file');
    }

    // If stored as a local uploads path (starts with /uploads/), convert to absolute path
    if (file.fileUrl.startsWith('/uploads/')) {
        const relativePath = file.fileUrl.replace(/^\/uploads\//, '');
        const absolutePath = path.join(process.cwd(), 'uploads', relativePath);

        if (!fsSync.existsSync(absolutePath)) {
            throw new ApiError(404, 'File not found on disk.');
        }

        return {
            path: absolutePath,
            fileName: file.fileName,
            mimeType: file.fileType,
        };
    }

    // If fileUrl is an absolute HTTP/HTTPS URL (external storage), we don't serve from disk.
    // Caller should handle redirecting or proxying from external storage.
    if (/^https?:\/\//i.test(file.fileUrl)) {
        throw new ApiError(501, 'File is stored in external storage. Download must be handled by the client or proxy.');
    }

    // Unknown URL format
    throw new ApiError(500, 'Unsupported file storage location.');
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
    getAllMedicalFiles,
};
