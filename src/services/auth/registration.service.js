const userRepository = require('../../repositories/user.repository');
const { ApiError } = require('../../api/middlewares/errorHandler');
const emailService = require('../email.service');
const { isoDateToObject } = require('../../utils/dateTimeValidator');
const { hashPassword } = require('../../utils/passwordHelper');
const { generateAndHashToken, generateTokenExpiry } = require('../../utils/tokenHelper');

/**
 * User Registration Service
 * Handles patient and personnel registration logic
 */

/**
 * Register a new patient user
 */
const registerUser = async (userData) => {
    // hash the password
    const hashedPassword = await hashPassword(userData.password);

    // dateOfBirth is provided as YYYY-MM-DD; construct Date object safely
    const dateOfBirthObject = isoDateToObject(userData.dateOfBirth);

    // Generate email verification token
    const { token: emailToken, hashedToken: hashedEmailToken } = generateAndHashToken();
    const emailTokenExpiry = generateTokenExpiry(24); // 24 hours

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
            isEmailVerified: false,
            emailToken: hashedEmailToken,
            emailTokenExpiry: emailTokenExpiry
        });

        // Send verification email (with unhashed token)
        await emailService.sendVerificationEmail(userData.email, emailToken, userData.firstName);

        delete newUser.password;
        return newUser;
    } catch (error) {
        throw error;
    }
};

/**
 * Register new personnel (doctor/admin/laborant)
 * Admin authentication is handled by middleware (authMiddleware + requireAdmin)
 */
const registerPersonnel = async (personnelData) => {
    // Determine target role from request (ADMIN, DOCTOR, LABORANT, etc.)
    const targetRole = personnelData.role;

    // Validate role
    if (!['DOCTOR', 'ADMIN', 'CASHIER', 'LABORANT', 'CLEANER'].includes(targetRole)) {
        throw new ApiError(400, 'Unsupported personnel role.');
    }

    // Hash the password
    const hashedPassword = await hashPassword(personnelData.password);

    const dateOfBirthObject = isoDateToObject(personnelData.dateOfBirth);

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
            isEmailVerified: true // Personnel auto-verified
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

module.exports = {
    registerUser,
    registerPersonnel,
};
