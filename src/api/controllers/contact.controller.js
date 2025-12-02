const contactService = require('../../services/contact.service');

/**
 * POST /api/v1/contact
 * Submit a contact form (public endpoint)
 */
const submitIssue = async (req, res, next) => {
    try {
        const result = await contactService.submitIssue(req.body);

        res.status(201).json({
            status: 'success',
            message: result.message,
            data: { id: result.id },
        });
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

        res.json({
            status: 'success',
            data: issues,
        });
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

        res.json({
            status: 'success',
            message: 'Reply sent successfully.',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitIssue,
    getAllIssues,
    replyToIssue,
};
