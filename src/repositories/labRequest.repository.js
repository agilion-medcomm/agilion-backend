const prisma = require('../config/db.js');
const { PAGINATION, REQUEST_STATUS } = require('../config/constants');

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

const findRequests = async (filters) => {
    const where = {};
    if (filters.status) where.status = { in: filters.status.split(',') };
    if (filters.patientId) where.patientId = parseInt(filters.patientId);
    if (filters.assignedLaborantId) where.assigneeLaborantId = parseInt(filters.assignedLaborantId);
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
    return prisma.$transaction(async (tx) => {
        const req = await tx.medicalFileRequest.findUnique({ where: { id: parseInt(requestId) } });
        if (!req) throw new Error('Request not found');
        if (req.status !== REQUEST_STATUS.PENDING || req.assigneeLaborantId) throw new Error('Request not claimable');
        return tx.medicalFileRequest.update({
            where: { id: parseInt(requestId) },
            data: { assigneeLaborantId: parseInt(laborantId), status: REQUEST_STATUS.ASSIGNED, assignedAt: new Date() },
        });
    });
};

const attachMedicalFile = async (requestId, medicalFileId) => {
    return prisma.$transaction(async (tx) => {
        await tx.medicalFile.update({ where: { id: parseInt(medicalFileId) }, data: { requestId: parseInt(requestId) } });
        return tx.medicalFileRequest.update({ where: { id: parseInt(requestId) }, data: { medicalFileId: parseInt(medicalFileId), status: REQUEST_STATUS.COMPLETED, completedAt: new Date() } });
    });
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
