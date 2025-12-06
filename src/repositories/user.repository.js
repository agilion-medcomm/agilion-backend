const prisma = require("../config/db.js");

/*
 * Finds a single user by their TCKN
 */
const findUserByTckn = async (tckn) => {
    return prisma.user.findUnique({
        where: { tckn },
    });
};

/*
 * Creates a new user in the database
 * If role is PATIENT, also creates Patient record
 * */
const createUser = async (userData) => {
    const userDataWithDefaults = {
        ...userData,
        isEmailVerified: userData.isEmailVerified ?? false,
        emailToken: userData.emailToken || null,
        emailTokenExpiry: userData.emailTokenExpiry || null,
    };

    if (userData.role === 'PATIENT') {
        const patient = await prisma.patient.create({
            data: {
                user: {
                    create: userDataWithDefaults,
                },
            },
            include: {
                user: true,
            },
        });
        return patient.user;
    }
    
    return prisma.user.create({
        data: userDataWithDefaults,
    });
};

/*
 * Creates a personnel user along with role-specific profile in a single transaction.
 * Currently supports DOCTOR (with Doctor profile) and ADMIN (with Admin profile).
 * Can be extended with more roles when needed.
 */
const createPersonnelWithUser = async (data) => {
    const baseUser = {
        firstName: data.firstName,
        lastName: data.lastName,
        tckn: data.tckn,
        role: data.role,
        dateOfBirth: data.dateOfBirth || null,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        isEmailVerified: data.isEmailVerified || false,
    };

    if (data.role === 'DOCTOR') {
        return prisma.doctor.create({
            data: {
                specialization: data.specialization,
                user: {
                    create: baseUser,
                },
            },
            include: {
                user: true,
            },
        });
    }

    if (data.role === 'ADMIN') {
        return prisma.admin.create({
            data: {
                user: {
                    create: baseUser,
                },
            },
            include: {
                user: true,
            },
        });
    }

    if (data.role === 'LABORANT') {
        return prisma.laborant.create({
            data: {
                user: {
                    create: baseUser,
                },
            },
            include: {
                user: true,
            },
        });
    }

    if (data.role === 'CLEANER') {
        return prisma.cleaner.create({
            data: {
                user: {
                    create: baseUser,
                },
            },
            include: {
                user: true,
            },
        });
    }

    // CASHIER doesn't have a separate profile table, just create the user
    if (data.role === 'CASHIER') {
        const user = await prisma.user.create({
            data: baseUser,
        });
        return { user };
    }

    throw new Error(`Unsupported personnel role for creation: ${data.role}`);
};

module.exports = {
    findUserByTckn,
    createUser,
    createPersonnelWithUser,
};
