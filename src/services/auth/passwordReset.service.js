const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../../config/db');
const { ApiError } = require('../../api/middlewares/errorHandler');
const emailService = require('../email.service');

/**
 * Password Reset Service
 * Handles password reset request and reset logic for patients
 */

/**
 * Request password reset
 * @param {string} email - User's email address
 */
const requestPasswordReset = async (email) => {
    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
        return {
            status: 'success',
            message: 'If the email exists, a password reset link has been sent.',
        };
    }

    // Only allow password reset for patients (PATIENT role)
    if (user.role !== 'PATIENT') {
        return {
            status: 'success',
            message: 'If the email exists, a password reset link has been sent.',
        };
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing (security best practice)
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set token expiry (1 hour from now)
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token and expiry
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: hashedToken,
            resetTokenExpiry,
        },
    });

    // Send password reset email with the unhashed token
    try {
        await emailService.sendPasswordResetEmail(
            user.email,
            resetToken,
            user.firstName
        );
    } catch (error) {
        // Silently fail - don't reveal email service errors to user
        // In production, log this to a monitoring service
    }

    return {
        status: 'success',
        message: 'If the email exists, a password reset link has been sent.',
    };
};

/**
 * Reset password using token
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 */
const resetPassword = async (token, newPassword) => {
    // Hash the provided token to match against database
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
        where: {
            resetToken: hashedToken,
            resetTokenExpiry: {
                gt: new Date(), // Token must not be expired
            },
        },
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired reset token.');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token fields
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });

    return {
        status: 'success',
        message: 'Password has been reset successfully.',
    };
};

module.exports = {
    requestPasswordReset,
    resetPassword,
};
