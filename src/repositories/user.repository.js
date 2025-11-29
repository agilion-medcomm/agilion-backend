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
    if (userData.role === 'PATIENT') {
        return prisma.patient.create({
            data: {
                user: {
                    create: userData,
                },
            },
            include: {
                user: true,
            },
        }).then(patient => patient.user);
    }
    
    return prisma.user.create({
        data: userData,
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

    throw new Error(`Unsupported personnel role for creation: ${data.role}`);
};

module.exports = {
    findUserByTckn,
    createUser,
    createPersonnelWithUser,
};
