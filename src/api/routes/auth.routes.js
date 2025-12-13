// Imports
const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const { sanitizeBody } = require("../middlewares/sanitize");
const  authMiddleware  = require("../middlewares/authMiddleware");

const { registerSchema, loginSchema, requestPasswordResetSchema, resetPasswordSchema, resendVerificationSchema } = require("../validations/auth.validation");

const { register, login, personnelLogin, getMe, requestPasswordReset, resetPassword, verifyEmail, resendVerificationEmail } = require("../controllers/auth.controller");

// POST /api/auth/register
router.post("/register", sanitizeBody, validate(registerSchema), register);

// POST /api/auth/login (unified login for all roles)
router.post("/login", sanitizeBody, validate(loginSchema), login);

// POST /api/auth/personnel/login (personnel-specific login returning user object)
router.post("/personnel/login", sanitizeBody, validate(loginSchema), personnelLogin);

// GET /api/auth/me (get current user profile)
router.get("/me", authMiddleware, getMe);

// POST /api/auth/request-password-reset (request password reset for patient)
router.post("/request-password-reset", sanitizeBody, validate(requestPasswordResetSchema), requestPasswordReset);

// POST /api/auth/reset-password (reset password using token)
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// POST /api/auth/verify-email (verify email with token)
router.post('/verify-email', verifyEmail);

// POST /api/auth/resend-verification (resend verification email, optionally update email)
router.post('/resend-verification', sanitizeBody, validate(resendVerificationSchema), resendVerificationEmail);

module.exports = router;
