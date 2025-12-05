const medicalFileRepository = require('../repositories/medicalFile.repository');
const { ApiError } = require('../api/middlewares/errorHandler');
const prisma = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

/**
 * Upload a medical file (Laborant only)
 */
const uploadMedicalFile = async (laborantId, fileData, uploadedFile) => {
    // Verify patient exists
    const patientExists = await medicalFileRepository.checkPatientExists(fileData.patientId);
    if (!patientExists) {
        // Delete uploaded file if patient doesn't exist
        if (uploadedFile && uploadedFile.path) {
            await fs.unlink(uploadedFile.path).catch(() => {});
        }
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
    if (userRole === 'ADMIN') {
        return file;
    }

    // DOCTOR can view all files (for their patients)
    if (userRole === 'DOCTOR') {
        return file;
    }

    // PATIENT can only view their own files
    if (userRole === 'PATIENT') {
        const patient = await prisma.patient.findUnique({
            where: { userId: parseInt(userId) },
        });

        if (!patient || patient.id !== file.patientId) {
            throw new ApiError(403, 'Access denied.');
        }
        return file;
    }

    // LABORANT can view files they uploaded
    if (userRole === 'LABORANT') {
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
 * - LABORANT: can delete their own uploaded files
 * - ADMIN: can delete any file
 */
const deleteMedicalFile = async (fileId, userId, userRole) => {
    const file = await medicalFileRepository.getFileById(fileId);
    
    if (!file || file.deletedAt) {
        throw new ApiError(404, 'Medical file not found.');
    }

    // Authorization check
    let canDelete = false;

    if (userRole === 'ADMIN') {
        canDelete = true;
    } else if (userRole === 'LABORANT') {
        const laborant = await prisma.laborant.findUnique({
            where: { userId: parseInt(userId) },
        });

        if (laborant && laborant.id === file.laborantId) {
            canDelete = true;
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

module.exports = {
    uploadMedicalFile,
    getPatientMedicalFiles,
    getMyMedicalFiles,
    getLaborantMedicalFiles,
    getMedicalFileById,
    deleteMedicalFile,
};
