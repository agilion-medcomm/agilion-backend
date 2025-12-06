const authService = require("../../services/auth.service");
const { ApiError } = require("../middlewares/errorHandler");
const { sendSuccess, sendCreated } = require('../../utils/responseFormatter');

const register = async (req, res, next) => {

    try {
        // Call authservice here
        const user = await authService.registerUser(req.body);

        sendCreated(res, {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            role: user.role,
        }, 'User registered successfully.');
    } catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {

    try {
        const { tckn, password } = req.body;

        const { token, user } = await authService.loginUser(tckn, password);

        sendSuccess(res, { token, user }, 'Login successful.');
    } catch (error) {
        next(error);
    }
};

const personnelLogin = async (req, res, next) => {

    try {
        const { tckn, password } = req.body;

        const { token, user } = await authService.loginPersonnel(tckn, password);

        sendSuccess(res, { token, user }, 'Login successful.');
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/auth/me
// Get current user profile (requires auth)
const getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserProfile(req.user.userId);
        sendSuccess(res, user);
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

        sendSuccess(res, null, result.message);
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

        sendSuccess(res, null, result.message);
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/auth/verify-email
// Verify email with token
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        const result = await authService.verifyEmail(token);
        sendSuccess(res, result.data, result.message);
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/auth/resend-verification
// Resend verification email with optional email update
const resendVerificationEmail = async (req, res, next) => {
    try {
        const { tckn, email } = req.body;
        const result = await authService.resendVerificationEmail(tckn, email);
        sendSuccess(res, result.data, result.message);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    personnelLogin,
    getMe,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
};
