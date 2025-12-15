const contactRepository = require('../repositories/contact.repository');
const { sendContactReplyEmail } = require('./email.service');
const { ApiError } = require('../api/middlewares/errorHandler');
const { CONTACT_STATUS } = require('../config/constants');

/**
 * Submit a new contact issue (public)
 * Validation is handled by middleware
 */
const submitIssue = async (issueData) => {
    const { name, email, phone, subject, message } = issueData;

    const contactIssue = await contactRepository.createContactIssue({
        name,
        email,
        phone,
        subject,
        message,
    });

    return {
        id: contactIssue.id,
        message: 'Your message has been submitted successfully.',
    };
};

/**
 * Get all contact issues (admin only)
 */
const getAllIssues = async () => {
    const issues = await contactRepository.getAllContactIssues();

    return issues.map((issue) => ({
        id: issue.id,
        name: issue.name,
        email: issue.email,
        phone: issue.phone,
        subject: issue.subject,
        message: issue.message,
        status: issue.status,
        replyMessage: issue.replyMessage,
        repliedAt: issue.repliedAt,
        createdAt: issue.createdAt,
    }));
};

/**
 * Reply to a contact issue (admin only)
 * Validation is handled by middleware
 */
const replyToIssue = async (issueId, replyMessage) => {
    // Get the issue first
    const issue = await contactRepository.getContactIssueById(issueId);

    if (!issue) {
        throw new ApiError(404, 'Contact issue not found.');
    }

    if (issue.status === CONTACT_STATUS.REPLIED) {
        throw new ApiError(400, 'This issue has already been replied to.');
    }

    // Send email to the user
    await sendContactReplyEmail(issue.email, issue.name, issue.subject, replyMessage);

    // Update the issue in database
    const updatedIssue = await contactRepository.replyToContactIssue(issueId, replyMessage);

    return {
        id: updatedIssue.id,
        status: updatedIssue.status,
        repliedAt: updatedIssue.repliedAt,
    };
};

module.exports = {
    submitIssue,
    getAllIssues,
    replyToIssue,
};
