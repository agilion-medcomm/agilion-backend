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
        const user = await authService.getUserProfile(req.user.userId);
        res.json({ data: user });
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
