const prisma = require('../config/db.js');

/**
 * Creates a new medical file record
 */
const createMedicalFile = async (data) => {
    return prisma.medicalFile.create({
        data: {
            patientId: data.patientId,
            laborantId: data.laborantId,
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            fileType: data.fileType,
            fileSizeKB: data.fileSizeKB,
            testName: data.testName,
            testDate: data.testDate,
            description: data.description,
        },
        include: {
            patient: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        }
                    }
                }
            },
            laborant: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            }
        },
    });
};

/**
 * Get medical files for a specific patient (excluding soft-deleted)
 */
const getFilesByPatientId = async (patientId) => {
    return prisma.medicalFile.findMany({
        where: { 
            patientId: parseInt(patientId),
            deletedAt: null, // Exclude soft-deleted files
        },
        include: {
            laborant: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Get medical files uploaded by a specific laborant (excluding soft-deleted)
 */
const getFilesByLaborantId = async (laborantId) => {
    return prisma.medicalFile.findMany({
        where: { 
            laborantId: parseInt(laborantId),
            deletedAt: null, // Exclude soft-deleted files
        },
        include: {
            patient: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Get a single medical file by ID (including soft-deleted for internal checks)
 */
const getFileById = async (fileId) => {
    return prisma.medicalFile.findUnique({
        where: { id: parseInt(fileId) },
        include: {
            patient: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            },
            laborant: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    }
                }
            }
        },
    });
};

/**
 * Soft delete a medical file by ID (tombstone method)
 * Sets deletedAt timestamp instead of removing the record
 */
const deleteFileById = async (fileId) => {
    return prisma.medicalFile.update({
        where: { id: parseInt(fileId) },
        data: { deletedAt: new Date() },
    });
};

/**
 * Check if a patient exists
 */
const checkPatientExists = async (patientId) => {
    const patient = await prisma.patient.findUnique({
        where: { id: parseInt(patientId) },
    });
    return !!patient;
};

module.exports = {
    createMedicalFile,
    getFilesByPatientId,
    getFilesByLaborantId,
    getFileById,
    deleteFileById,
    checkPatientExists,
};
