const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');
const validate = require('../middlewares/validate');
const { sanitizeBody } = require('../middlewares/sanitize');
const { submitIssueSchema, replyToIssueSchema } = require('../validations/contact.validation');

// POST /api/v1/contact - Submit contact form (public)
router.post('/', sanitizeBody, validate(submitIssueSchema), contactController.submitIssue);

// GET /api/v1/contact - Get all issues (admin only)
router.get('/', authMiddleware, requireAdmin, contactController.getAllIssues);

// POST /api/v1/contact/:id/reply - Reply to issue (admin only)
router.post('/:id/reply', authMiddleware, requireAdmin, sanitizeBody, validate(replyToIssueSchema), contactController.replyToIssue);

module.exports = router;
