// Imports
const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const authMiddleware = require("../middlewares/authMiddleware");

const { registerSchema, loginSchema, personnelRegisterSchema, requestPasswordResetSchema, resetPasswordSchema } = require("../validations/auth.validation");

const { register, login, personnelLogin, personnelRegister, getMe, requestPasswordReset, resetPassword } = require("../controllers/auth.controller");

// POST /api/auth/register
router.post("/register", validate(registerSchema), register);

// POST /api/auth/login (unified login for all roles)
router.post("/login", validate(loginSchema), login);

// POST /api/auth/personnel/login (personnel-specific login returning user object)
router.post("/personnel/login", validate(loginSchema), personnelLogin);

// POST /api/auth/personnel/register (admin creates personnel)
router.post("/personnel/register", validate(personnelRegisterSchema), personnelRegister);

// GET /api/auth/me (get current user profile)
router.get("/me", authMiddleware, getMe);

// POST /api/auth/request-password-reset (request password reset for patient)
router.post("/request-password-reset", validate(requestPasswordResetSchema), requestPasswordReset);

// POST /api/auth/reset-password (reset password using token)
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

module.exports = router;
