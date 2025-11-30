const crypto = require('crypto');
const prisma = require('../../config/db');
const userRepository = require('../../repositories/user.repository');
const { ApiError } = require('../../api/middlewares/errorHandler');
const emailService = require('../email.service');

/**
 * Email Verification Service
 * Handles email verification and resend verification logic
 */

/**
 * Verify email using token
 * @param {string} token - Verification token from email
 */
const verifyEmail = async (token) => {
    // Hash the token to match against database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await prisma.user.findFirst({
        where: {
            emailToken: hashedToken,
            emailTokenExpiry: { gt: new Date() }
        }
    });

    if (!user) {
        throw new ApiError(400, 'Geçersiz veya süresi dolmuş doğrulama bağlantısı.');
    }

    // Mark email as verified and clear token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true,
            emailToken: null,
            emailTokenExpiry: null
        }
    });

    return { status: 'success', message: 'E-posta başarıyla doğrulandı. Giriş yapabilirsiniz.' };
};

/**
 * Resend verification email with option to update email address
 * Allows users who registered with wrong email to correct it
 * @param {string} tckn - User's TCKN
 * @param {string} newEmail - New email address (optional, if user wants to update)
 */
const resendVerificationEmail = async (tckn, newEmail = null) => {
    // Find user by TCKN
    const user = await userRepository.findUserByTckn(tckn);

    if (!user) {
        throw new ApiError(404, 'Kullanıcı bulunamadı.');
    }

    // Check if already verified
    if (user.isEmailVerified) {
        throw new ApiError(400, 'E-posta adresi zaten doğrulanmış.');
    }

    // Only allow for PATIENT role (personnel are auto-verified)
    if (user.role !== 'PATIENT') {
        throw new ApiError(403, 'Bu işlem sadece hasta hesapları için geçerlidir.');
    }

    let emailToUse = user.email;

    // If user wants to update email
    if (newEmail && newEmail !== user.email) {
        // Check if new email is already taken by another user
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail }
        });

        if (existingUser && existingUser.id !== user.id) {
            throw new ApiError(400, 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.');
        }

        emailToUse = newEmail;
    }

    // Generate new verification token
    const emailToken = crypto.randomBytes(32).toString('hex');
    const hashedEmailToken = crypto.createHash('sha256').update(emailToken).digest('hex');
    const emailTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new email (if changed) and new token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            email: emailToUse,
            emailToken: hashedEmailToken,
            emailTokenExpiry: emailTokenExpiry
        }
    });

    // Send verification email to the (possibly new) email address
    await emailService.sendVerificationEmail(emailToUse, emailToken, user.firstName);

    return {
        status: 'success',
        message: newEmail ? 'E-posta adresi güncellendi. Doğrulama bağlantısı yeni adresinize gönderildi.' : 'Doğrulama bağlantısı e-posta adresinize tekrar gönderildi.',
        data: { email: emailToUse }
    };
};

module.exports = {
    verifyEmail,
    resendVerificationEmail,
};
