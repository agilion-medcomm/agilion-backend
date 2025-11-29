const express = require('express');
const router = express.Router();
const personnelController = require('../controllers/personnel.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');

// GET /api/v1/personnel - List all personnel (admin only)
router.get('/', authMiddleware, requireAdmin, personnelController.getPersonnel);

// POST /api/v1/personnel - Register new personnel (admin only, accepts token in body or header)
router.post('/', authMiddleware, requireAdmin, personnelController.createPersonnel);

// PUT /api/v1/personnel/:id - Update personnel (admin only)
router.put('/:id', authMiddleware, requireAdmin, personnelController.updatePersonnel);

// DELETE /api/v1/personnel/:id - Delete personnel (admin only)
router.delete('/:id', authMiddleware, requireAdmin, personnelController.deletePersonnel);

module.exports = router;
