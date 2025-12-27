const prisma = require('../config/db.js');
const { validateRequiredFields } = require('../utils/validators');
const { ApiError } = require('../api/middlewares/errorHandler');

/**
 * Creates a new medical file record
 */
const createMedicalFile = async (data) => {
    // Prevent callers from creating a medical file already linked to a request
    if (data.requestId) {
        throw new ApiError(400, 'Do not set requestId when creating a standalone medical file. Use the request-driven upload flow instead.');
    }

    // Validate required fields for a medical file
    validateRequiredFields(data, ['patientId', 'fileName', 'fileUrl', 'fileType', 'fileSizeKB', 'testName', 'testDate']);

    return prisma.medicalFile.create({
        data: {
            patientId: parseInt(data.patientId),
            laborantId: data.laborantId ? parseInt(data.laborantId) : null,
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            fileType: data.fileType,
            fileSizeKB: parseFloat(data.fileSizeKB),
            testName: data.testName,
            testDate: data.testDate,
            description: data.description || null,
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
            },
            request: {
                include: {
                    assigneeLaborant: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                }
                            }
                        }
                    },
                    createdByUser: {
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
            },
            request: {
                include: {
                    assigneeLaborant: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                }
                            }
                        }
                    },
                    createdByUser: {
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
            },
            request: {
                include: {
                    assigneeLaborant: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    email: true
                                }
                            }
                        }
                    }
                }
            }
        },
    });
};

/**
 * Admin: get all medical files with optional filters
 * options: { includeDeleted: boolean, includeOrphaned: boolean }
 */
const getAllFiles = async (options = {}) => {
    const { includeDeleted = false, includeOrphaned = false } = options;

    const where = {};
    if (!includeDeleted) where.deletedAt = null;
    if (!includeOrphaned) where.laborantId = { not: null };

    return prisma.medicalFile.findMany({
        where,
        include: {
            patient: {
                include: { user: { select: { firstName: true, lastName: true, email: true } } }
            },
            laborant: {
                include: { user: { select: { firstName: true, lastName: true, email: true } } }
            },
            request: {
                include: {
                    assigneeLaborant: {
                        include: { user: { select: { firstName: true, lastName: true, email: true } } }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
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
 * Permanently remove a medical file record from the database
 * Returns the deleted record (so caller can remove physical file)
 */
const hardDeleteFileById = async (fileId) => {
    return prisma.medicalFile.delete({
        where: { id: parseInt(fileId) },
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
    getAllFiles,
    deleteFileById,
    hardDeleteFileById,
    checkPatientExists,
};
