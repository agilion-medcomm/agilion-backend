const prisma = require('../config/db.js');

/**
 * Create a new contact issue
 */
const createContactIssue = async (data) => {
    return prisma.contactIssue.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            status: 'PENDING',
        },
    });
};

/**
 * Get all contact issues (sorted by createdAt desc)
 */
const getAllContactIssues = async () => {
    return prisma.contactIssue.findMany({
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Get a contact issue by ID
 */
const getContactIssueById = async (id) => {
    return prisma.contactIssue.findUnique({
        where: { id: parseInt(id) },
    });
};

/**
 * Update contact issue with reply
 */
const replyToContactIssue = async (id, replyMessage) => {
    return prisma.contactIssue.update({
        where: { id: parseInt(id) },
        data: {
            status: 'REPLIED',
            replyMessage,
            repliedAt: new Date(),
        },
    });
};

module.exports = {
    createContactIssue,
    getAllContactIssues,
    getContactIssueById,
    replyToContactIssue,
};
