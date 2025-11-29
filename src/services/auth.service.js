/**
 * Auth Service - Main Entry Point
 * 
 * This service aggregates all authentication-related functionality.
 * Individual concerns are separated into specialized modules in the auth/ folder:
 * - registration.service.js: User and personnel registration
 * - login.service.js: Patient and personnel login
 * - passwordReset.service.js: Password reset flow
 * - emailVerification.service.js: Email verification and resend
 * - profile.service.js: User profile retrieval
 */

const profileService = require('./auth/profile.service');
const registrationService = require('./auth/registration.service');
const loginService = require('./auth/login.service');
const passwordResetService = require('./auth/passwordReset.service');
const emailVerificationService = require('./auth/emailVerification.service');

module.exports = {
    // Profile
    getUserProfile: profileService.getUserProfile,
    
    // Registration
    registerUser: registrationService.registerUser,
    registerPersonnel: registrationService.registerPersonnel,
    
    // Login
    loginUser: loginService.loginUser,
    loginPersonnel: loginService.loginPersonnel,
    
    // Password Reset
    requestPasswordReset: passwordResetService.requestPasswordReset,
    resetPassword: passwordResetService.resetPassword,
    
    // Email Verification
    verifyEmail: emailVerificationService.verifyEmail,
    resendVerificationEmail: emailVerificationService.resendVerificationEmail,
};
