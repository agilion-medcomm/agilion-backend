const express = require('express');
const router = express.Router();
const homeHealthController = require('../controllers/homeHealth.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { sanitizeBody } = require('../middlewares/sanitize');
const { createRequestSchema, approveRejectSchema } = require('../validations/homeHealth.validation');
const { ROLES } = require('../../config/constants');

/**
 * Home Health Request Routes
 * 
 * POST   /api/v1/home-health              - Create new request (authenticated users)
 * GET    /api/v1/home-health              - Get all requests (Admin, Cashier)
 * GET    /api/v1/home-health/stats        - Get statistics (Admin, Cashier)
 * GET    /api/v1/home-health/:id          - Get single request (Admin, Cashier)
 * PATCH  /api/v1/home-health/:id/approve  - Approve request (Admin, Cashier)
 * PATCH  /api/v1/home-health/:id/reject   - Reject request (Admin, Cashier)
 */

// POST /api/v1/home-health - Create new home health request (all authenticated users)
router.post(
    '/',
    authMiddleware,
    sanitizeBody,
    validate(createRequestSchema),
    homeHealthController.createRequest
);

// GET /api/v1/home-health/stats - Get statistics (Admin, Cashier only)
// Note: This must come before /:id route to avoid route conflict
router.get(
    '/stats',
    authMiddleware,
    authorize(ROLES.ADMIN, ROLES.CASHIER),
    homeHealthController.getStats
);

// GET /api/v1/home-health - Get all requests (Admin, Cashier only)
router.get(
    '/',
    authMiddleware,
    authorize(ROLES.ADMIN, ROLES.CASHIER),
    homeHealthController.getAllRequests
);

// GET /api/v1/home-health/:id - Get single request by ID (Admin, Cashier only)
router.get(
    '/:id',
    authMiddleware,
    authorize(ROLES.ADMIN, ROLES.CASHIER),
    homeHealthController.getRequestById
);

// PATCH /api/v1/home-health/:id/approve - Approve request (Admin, Cashier only)
router.patch(
    '/:id/approve',
    authMiddleware,
    authorize(ROLES.ADMIN, ROLES.CASHIER),
    sanitizeBody,
    validate(approveRejectSchema),
    homeHealthController.approve
);

// PATCH /api/v1/home-health/:id/reject - Reject request (Admin, Cashier only)
router.patch(
    '/:id/reject',
    authMiddleware,
    authorize(ROLES.ADMIN, ROLES.CASHIER),
    sanitizeBody,
    validate(approveRejectSchema),
    homeHealthController.reject
);

module.exports = router;

