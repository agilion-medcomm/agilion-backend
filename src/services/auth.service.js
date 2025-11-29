const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const { ApiError } = require('../api/middlewares/errorHandler');
const emailService = require('./email.service');

/**
 * Handles business logic
 */

const registerUser = async (userData) => {

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // dateOfBirth is provided as YYYY-MM-DD; construct Date object safely
    const dateOfBirthObject = userData.dateOfBirth ? new Date(`${userData.dateOfBirth}T00:00:00.000Z`) : null;

    // create user
    try {
        const newUser = await userRepository.createUser({
            firstName: userData.firstName,
            lastName: userData.lastName,
            tckn: userData.tckn,
            role: userData.role || 'PATIENT', // Explicitly default to PATIENT for registration
            dateOfBirth: dateOfBirthObject,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            password: hashedPassword,
        });

        delete newUser.password;
        return newUser;
    } catch (error) {
        throw error;
    }
};

// Business Logic for personnel (doctor/admin) registration
// Admin authentication is handled by middleware (authMiddleware + requireAdmin)
// This service just handles the business logic of creating personnel
const registerPersonnel = async (personnelData) => {
    // Determine target role from request (ADMIN, DOCTOR, etc.)
    const targetRole = personnelData.role;

    // Validate role
    if (!['DOCTOR', 'ADMIN'].includes(targetRole)) {
        throw new ApiError(400, 'Unsupported personnel role.');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(personnelData.password, salt);

    const dateOfBirthObject = personnelData.dateOfBirth
        ? new Date(`${personnelData.dateOfBirth}T00:00:00.000Z`)
        : null;

    try {
        const created = await userRepository.createPersonnelWithUser({
            firstName: personnelData.firstName,
            lastName: personnelData.lastName,
            tckn: personnelData.tckn,
            role: targetRole,
            dateOfBirth: dateOfBirthObject,
            email: personnelData.email || undefined,
            phoneNumber: personnelData.phoneNumber || undefined,
            password: hashedPassword,
            specialization: personnelData.specialization,
        });

        // Return created personnel data
        return {
            status: 'success',
            message: `Personnel with TCKN ${created.user.tckn} registered successfully.`,
            data: {
                id: created.id,
                userId: created.user.id,
                tckn: created.user.tckn,
                firstName: created.user.firstName,
                lastName: created.user.lastName,
                email: created.user.email,
                phoneNumber: created.user.phoneNumber,
                role: created.user.role,
                specialization: created.specialization || null,
            },
        };
    } catch (error) {
        throw error;
    }
};

/*
 * Business Logic for user login
 * */

const loginUser = async (tckn, password) => {
    // find user by tckn
    const user = await userRepository.findUserByTckn(tckn);

    // check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ApiError(401, 'Invalid TCKN or password.');
    }

    // create jwt
    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role,
            tckn: user.tckn,
        },
        process.env.JWT_SECRET,
        { expiresIn: '30m' } // token duration
    );

    // Return both token and user (like personnelLogin)
    return {
        token,
        user: {
            id: user.id,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            tckn: user.tckn,
            dateOfBirth: user.dateOfBirth,
        },
    };
};

const loginPersonnel = async (tckn, password) => {
    // find user by tckn with doctor/admin relations
    const prisma = require('../config/db');
    const user = await prisma.user.findUnique({
        where: { tckn },
        include: {
            doctor: true,
            admin: true,
        },
    });

    // check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ApiError(401, 'Invalid TCKN or password.');
    }

    // create jwt
    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role,
            tckn: user.tckn,
        },
        process.env.JWT_SECRET,
        { expiresIn: '30m' } // token duration
    );

    const userWithoutPassword = {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        tckn: user.tckn,
        dateOfBirth: user.dateOfBirth,
        // Add doctor/admin IDs if they exist
        doctorId: user.doctor?.id || null,
        adminId: user.admin?.id || null,
        specialization: user.doctor?.specialization || null,
    };

    return { token, user: userWithoutPassword };
};

/**
 * Request password reset
 * @param {string} email - User's email address
 */
const requestPasswordReset = async (email) => {
    const prisma = require('../config/db');

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return {
            status: 'success',
            message: 'If the email exists, a password reset link has been sent.',
        };
    }

    // Only allow password reset for patients (PATIENT role)
    if (user.role !== 'PATIENT') {
        console.log(`[PASSWORD RESET] ⚠️  Requested for non-patient account: ${email} (Role: ${user.role})`);
        return {
            status: 'success',
            message: 'If the email exists, a password reset link has been sent.',
        };
    }

    console.log(`[PASSWORD RESET] ✅ Valid patient found: ${user.firstName} ${user.lastName} (${email})`);

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(`[PASSWORD RESET] Token generated (length: ${resetToken.length})`);
    
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
    console.log(`[PASSWORD RESET] Calling email service...`);
    try {
        await emailService.sendPasswordResetEmail(
            user.email,
            resetToken,
            user.firstName
        );
        console.log(`[PASSWORD RESET] ✅ Email service completed successfully`);
    } catch (error) {
        console.error('[PASSWORD RESET] ❌ Email service failed:', error.message);
        // Don't throw error to user, just log it
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
    const prisma = require('../config/db');

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
    registerUser,
    registerPersonnel,
    loginUser,
    loginPersonnel,
    requestPasswordReset,
    resetPassword,
}
