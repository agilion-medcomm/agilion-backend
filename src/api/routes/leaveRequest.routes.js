const express = require('express');
const router = express.Router();
const leaveRequestController = require('../controllers/leaveRequest.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');

// GET /api/v1/leave-requests - Get leave requests (auth required)
router.get('/', authMiddleware, leaveRequestController.getLeaveRequests);

// POST /api/v1/leave-requests - Create leave request (auth required)
router.post('/', authMiddleware, leaveRequestController.createLeaveRequest);

// PUT /api/v1/leave-requests/:id/status - Update status (admin only)
router.put('/:id/status', authMiddleware, requireAdmin, leaveRequestController.updateLeaveRequestStatus);

module.exports = router;
