const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const userRepository = require('../../repositories/user.repository');
const { ApiError } = require('../../api/middlewares/errorHandler');

/**
 * Login Service
 * Handles patient and personnel login logic
 */

/**
 * Login for patients
 */
const loginUser = async (tckn, password) => {
    // find user by tckn
    const user = await userRepository.findUserByTckn(tckn);

    // check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
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

/**
 * Login for personnel (doctors/admins)
 */
const loginPersonnel = async (tckn, password) => {
    // find user by tckn with doctor/admin relations
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

module.exports = {
    loginUser,
    loginPersonnel,
};
