const prisma = require('../../config/db');
const bcrypt = require('bcrypt');
const { ApiError } = require('../middlewares/errorHandler');
const userRepository = require('../../repositories/user.repository');

/**
 * GET /api/v1/personnel
 * List all personnel (admin only)
 */
const getPersonnel = async (req, res, next) => {
    try {
        const [doctors, admins] = await Promise.all([
            prisma.doctor.findMany({
                include: { user: true },
            }),
            prisma.admin.findMany({
                include: { user: true },
            }),
        ]);

        const personnel = [
            ...doctors.map(d => ({
                id: d.user.id,
                tckn: d.user.tckn,
                firstName: d.user.firstName,
                lastName: d.user.lastName,
                email: d.user.email,
                phoneNumber: d.user.phoneNumber,
                role: d.user.role,
                specialization: d.specialization,
                dateOfBirth: d.user.dateOfBirth,
            })),
            ...admins.map(a => ({
                id: a.user.id,
                tckn: a.user.tckn,
                firstName: a.user.firstName,
                lastName: a.user.lastName,
                email: a.user.email,
                phoneNumber: a.user.phoneNumber,
                role: a.user.role,
                dateOfBirth: a.user.dateOfBirth,
            })),
        ];

        res.json({ status: 'success', data: personnel });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/personnel
 * Register new personnel (admin only - enforced by middleware)
 */
const createPersonnel = async (req, res, next) => {
    try {
        const authService = require('../../services/auth.service');
        
        // Middleware already verified admin role via authMiddleware + requireAdmin
        const result = await authService.registerPersonnel(req.body);
        
        res.status(201).json({
            status: result.status,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/personnel/:id
 * Update personnel details
 */
const updatePersonnel = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Hash password if provided
        if (updates.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(updates.password, salt);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updates,
        });

        // eslint-disable-next-line no-unused-vars
        const { password, ...userWithoutPass } = user;

        res.json({
            status: 'success',
            message: 'Personnel updated successfully.',
            data: userWithoutPass,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/personnel/:id
 * Delete personnel (admin only)
 */
const deletePersonnel = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.user.delete({
            where: { id: parseInt(id) },
        });

        res.json({
            status: 'success',
            message: 'Personnel deleted successfully.',
            data: { id: parseInt(id) },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPersonnel,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
};
