const authService = require("../../services/auth.service");
const { ApiError } = require("../middlewares/errorHandler");

const register = async (req, res, next) => {

    try {
        // Call authservice here
        const user = await authService.registerUser(req.body);

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully.',
            data: {
                userId: user.id, // Or 'userId: user.userId' depending on your model
                email: user.email,
                firstName: user.firstName,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {

    try {
        const { tckn, password } = req.body;

        const { token, user } = await authService.loginUser(tckn, password);

        res.status(200).json({
            status: 'success',
            message: 'Login successful.',
            data: {
                token: token,
                user: user,
            },
        });
    } catch (error) {
        next(error);
    }
};

const personnelLogin = async (req, res, next) => {

    try {
        console.log("--> KAPI ÇALINDI! Controller'ın içine girildi.");
        const { tckn, password } = req.body;

        const { token, user } = await authService.loginPersonnel(tckn, password);

        res.status(200).json({
            status: 'success',
            message: 'Login successful.',
            data: {
                token: token,
                user: user,
            },
        });
    } catch (error) {
        next(error);
    }
};

const personnelRegister = async (req, res, next) => {
    try {
        const result = await authService.registerPersonnel(req.body);

        return res.status(201).json({
            status: result.status,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/auth/me
// Get current user profile (requires auth)
const getMe = async (req, res, next) => {
    try {
        const prisma = require('../../config/db');
        
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                tckn: true,
                email: true,
                phoneNumber: true,
                dateOfBirth: true,
                role: true,
                doctor: {
                    select: {
                        id: true,
                        specialization: true,
                    },
                },
                admin: {
                    select: {
                        id: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!user) {
            throw new ApiError(404, 'User not found.');
        }

        // Format response based on role
        const response = {
            id: user.doctor?.id || user.admin?.id || user.patient?.id || user.id,
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            tckn: user.tckn,
            email: user.email,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            role: user.role,
        };

        if (user.doctor) {
            response.specialization = user.doctor.specialization;
        }

        res.json({ data: response });
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/auth/request-password-reset
// Request password reset for patient
const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        const result = await authService.requestPasswordReset(email);

        res.status(200).json({
            status: result.status,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/auth/reset-password
// Reset password using token
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        
        const result = await authService.resetPassword(token, newPassword);

        res.status(200).json({
            status: result.status,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    personnelLogin,
    personnelRegister,
    getMe,
    requestPasswordReset,
    resetPassword,
};
