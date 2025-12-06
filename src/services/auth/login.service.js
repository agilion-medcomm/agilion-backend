const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const { ApiError } = require('../../api/middlewares/errorHandler');
const { comparePassword } = require('../../utils/passwordHelper');

/**
 * Login Service
 * Handles patient and personnel login logic
 */

/**
 * Login for patients
 */
const loginUser = async (tckn, password) => {
    // find user by tckn
    const user = await prisma.user.findUnique({
        where: { tckn },
        include: {
            patient: true,
        },
    });
    // check if user exists and password is correct
    if (!user || !(await comparePassword(password, user.password))) {
        throw new ApiError(401, 'Invalid TCKN or password.');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
        throw new ApiError(403, 'Lütfen giriş yapmadan önce e-posta adresinizi doğrulayın.');
    }

    // create jwt
    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role,
            tckn: user.tckn,
            patientId: user.patient?.id,
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
            patientId: user.patient?.id,
        },
    };
};

/**
 * Login for personnel (doctors/admins/laborants)
 */
const loginPersonnel = async (tckn, password) => {
    // find user by tckn with doctor/admin/laborant relations
    const user = await prisma.user.findUnique({
        where: { tckn },
        include: {
            doctor: true,
            admin: true,
            laborant: true,
        },
    });

    // check if user exists and password is correct
    if (!user || !(await comparePassword(password, user.password))) {
        throw new ApiError(401, 'Invalid TCKN or password.');
    }

    // Prepare token payload with role-specific IDs
    const tokenPayload = {
        userId: user.id,
        role: user.role,
        tckn: user.tckn,
    };

    // Add role-specific ID to token payload
    if (user.doctor) {
        tokenPayload.doctorId = user.doctor.id;
    }
    if (user.admin) {
        tokenPayload.adminId = user.admin.id;
    }
    if (user.laborant) {
        tokenPayload.laborantId = user.laborant.id;
    }

    // create jwt
    const token = jwt.sign(
        tokenPayload,
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
        // Add doctor/admin/laborant IDs if they exist
        doctorId: user.doctor?.id || null,
        adminId: user.admin?.id || null,
        laborantId: user.laborant?.id || null,
        specialization: user.doctor?.specialization || null,
    };

    return { token, user: userWithoutPassword };
};

module.exports = {
    loginUser,
    loginPersonnel,
};
