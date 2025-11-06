// Imports
const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");

const { registerSchema, loginSchema } = require("../validations/auth.validation");

const { register, login } = require("../controllers/auth.controller");

// POST /api/auth/register
router.post("/register", validate(registerSchema), register);

// post req to /login
router.post("/login", validate(loginSchema), login);


module.exports = router;

