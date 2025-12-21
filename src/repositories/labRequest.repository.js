const prisma = require('../config/db.js');
const { PAGINATION, REQUEST_STATUS } = require('../config/constants');
const { ApiError } = require('../api/middlewares/errorHandler');

const createRequest = async (data) => {
    return prisma.medicalFileRequest.create({
        data: {
            patientId: data.patientId,
            createdByUserId: data.createdByUserId,
            assigneeLaborantId: data.assigneeLaborantId || null,
            fileTitle: data.fileTitle,
            notes: data.notes || null,
            status: data.assigneeLaborantId ? REQUEST_STATUS.ASSIGNED : REQUEST_STATUS.PENDING,
            requestedAt: data.requestedAt || new Date(),
        },
        include: {
            patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
            assigneeLaborant: { include: { user: { select: { firstName: true, lastName: true } } } },
            medicalFile: true,
        },
    });
};

const findRequestById = async (id) => {
    return prisma.medicalFileRequest.findUnique({
        where: { id: parseInt(id) },
        include: {
            patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            createdByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
            assigneeLaborant: { include: { user: { select: { firstName: true, lastName: true } } } },
            medicalFile: true,
        },
    });
};

const findRequests = async (filters = {}) => {
    const where = {};
    if (filters.status) {
        if (Array.isArray(filters.status)) {
            where.status = { in: filters.status };
        } else if (typeof filters.status === 'string') {
            where.status = { in: filters.status.split(',').map(s => s.trim()).filter(Boolean) };
        }
    }
    if (filters.patientId) where.patientId = parseInt(filters.patientId);

    // Accept both naming variants from callers for safety
    const assignee = filters.assigneeLaborantId || filters.assignedLaborantId;
    if (assignee) where.assigneeLaborantId = parseInt(assignee);

    if (filters.createdByUserId) where.createdByUserId = parseInt(filters.createdByUserId);

    const page = parseInt(filters.page) || 1;
    const pageSize = parseInt(filters.pageSize) || PAGINATION.DEFAULT_LIMIT;

    return prisma.medicalFileRequest.findMany({
        where,
        include: {
            patient: { include: { user: { select: { firstName: true, lastName: true } } } },
            createdByUser: { select: { id: true, firstName: true, lastName: true } },
            assigneeLaborant: { include: { user: { select: { firstName: true, lastName: true } } } },
            medicalFile: true,
        },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
    });
};

const assignToLaborant = async (requestId, laborantId) => {
    return prisma.medicalFileRequest.update({
        where: { id: parseInt(requestId) },
        data: { assigneeLaborantId: parseInt(laborantId), status: REQUEST_STATUS.ASSIGNED, assignedAt: new Date() },
    });
};

const claimRequest = async (requestId, laborantId) => {
    // Atomically claim if currently PENDING and unassigned
    try {
        return await prisma.$transaction(async (tx) => {
            const req = await tx.medicalFileRequest.findUnique({ where: { id: parseInt(requestId) } });
            if (!req) throw new ApiError(404, 'Lab request not found');
            if (req.status !== REQUEST_STATUS.PENDING || req.assigneeLaborantId) throw new ApiError(400, 'Request not claimable');
            return tx.medicalFileRequest.update({
                where: { id: parseInt(requestId) },
                data: { assigneeLaborantId: parseInt(laborantId), status: REQUEST_STATUS.ASSIGNED, assignedAt: new Date() },
            });
        });
    } catch (err) {
        if (err && err.code === 'P2025') {
            throw new ApiError(404, 'Lab request not found');
        }
        if (err && err.code === 'P2002') {
            throw new ApiError(409, 'Conflict while claiming request (possible race)');
        }
        throw err;
    }
};

const attachMedicalFile = async (requestId, medicalFileId) => {
    try {
        return await prisma.$transaction(async (tx) => {
            const req = await tx.medicalFileRequest.findUnique({ where: { id: parseInt(requestId) } });
            const mf = await tx.medicalFile.findUnique({ where: { id: parseInt(medicalFileId) } });
            if (!mf) throw new ApiError(404, 'Medical file not found');
            // Prevent cross-linking: if the medical file is already attached to another request, reject
            if (mf.requestId && mf.requestId !== parseInt(requestId)) {
                throw new ApiError(400, 'Medical file already attached to another request');
            }
            if (!req) throw new ApiError(404, 'Lab request not found');
            // If already attached, return the request (idempotent)
            if (req.medicalFileId) {
                if (req.medicalFileId === parseInt(medicalFileId)) return req;
                throw new ApiError(400, 'Request already completed with another medical file');
            }

            // Link medical file to request and mark completed
            await tx.medicalFile.update({ where: { id: parseInt(medicalFileId) }, data: { requestId: parseInt(requestId) } });
            return tx.medicalFileRequest.update({ where: { id: parseInt(requestId) }, data: { medicalFileId: parseInt(medicalFileId), status: REQUEST_STATUS.COMPLETED, completedAt: new Date() } });
        });
    } catch (err) {
        if (err && err.code === 'P2002') {
            // Unique constraint violation (if DB constraint exists)
            throw new ApiError(409, 'Conflict while attaching medical file (possible race)');
        }
        if (err && err.code === 'P2025') {
            throw new ApiError(404, 'Record not found during attach operation');
        }
        throw err;
    }
};

const cancelRequest = async (requestId) => {
    return prisma.medicalFileRequest.update({ where: { id: parseInt(requestId) }, data: { status: REQUEST_STATUS.CANCELED, canceledAt: new Date() } });
};

module.exports = {
    createRequest,
    findRequestById,
    findRequests,
    assignToLaborant,
    claimRequest,
    attachMedicalFile,
    cancelRequest,
};
