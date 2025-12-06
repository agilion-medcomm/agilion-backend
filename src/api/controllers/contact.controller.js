const contactService = require('../../services/contact.service');
const { sendSuccess, sendCreated } = require('../../utils/responseFormatter');

/**
 * POST /api/v1/contact
 * Submit a contact form (public endpoint)
 */
const submitIssue = async (req, res, next) => {
    try {
        const result = await contactService.submitIssue(req.body);

        sendCreated(res, { id: result.id }, result.message);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/contact
 * Get all contact issues (admin only)
 */
const getAllIssues = async (req, res, next) => {
    try {
        const issues = await contactService.getAllIssues();
        sendSuccess(res, issues);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/contact/:id/reply
 * Reply to a contact issue (admin only)
 */
const replyToIssue = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { replyMessage } = req.body;

        const result = await contactService.replyToIssue(id, replyMessage);
        sendSuccess(res, result, 'Reply sent successfully.');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitIssue,
    getAllIssues,
    replyToIssue,
};
