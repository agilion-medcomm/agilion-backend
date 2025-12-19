const express = require('express');
const router = express.Router();
const labRequestController = require('../controllers/labRequest.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const { ROLES } = require('../../config/constants');
const validate = require('../middlewares/validate');
const Joi = require('joi');
const { ensureCreatorOrAdmin, ensureLaborantAssignedOrClaimable } = require('../middlewares/labRequestAuth');

// Simple validation for create
const createSchema = Joi.object({
    patientId: Joi.number().integer().required(),
    fileTitle: Joi.string().min(1).required(),
    notes: Joi.string().allow('', null),
    assigneeLaborantId: Joi.number().integer().optional(),
});

// POST create request (Doctor or Admin)
router.post('/', authMiddleware, authorize(ROLES.DOCTOR, ROLES.ADMIN), validate(createSchema), labRequestController.createLabRequest);

// GET list requests (Doctor/Laborant/Admin)
router.get('/', authMiddleware, authorize(ROLES.DOCTOR, ROLES.LABORANT, ROLES.ADMIN), labRequestController.listLabRequests);

// GET detail
router.get('/:id', authMiddleware, authorize(ROLES.DOCTOR, ROLES.LABORANT, ROLES.ADMIN), labRequestController.getLabRequest);

// Assign (Admin or creating Doctor allowed - route-level only)
router.put('/:id/assign', authMiddleware, authorize(ROLES.DOCTOR, ROLES.ADMIN), ensureCreatorOrAdmin, labRequestController.assignLabRequest);

// Laborant claim
router.put('/:id/claim', authMiddleware, authorize(ROLES.LABORANT), ensureLaborantAssignedOrClaimable, labRequestController.claimLabRequest);

// Confirm (complete) - laborant
router.put('/:id/confirm', authMiddleware, authorize(ROLES.LABORANT), ensureLaborantAssignedOrClaimable, labRequestController.confirmLabRequest);

// Cancel (doctor who created it or admin)
router.post('/:id/cancel', authMiddleware, authorize(ROLES.DOCTOR, ROLES.ADMIN), ensureCreatorOrAdmin, labRequestController.cancelLabRequest);

module.exports = router;
