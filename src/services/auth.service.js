const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { ApiError } = require('../api/middlewares/errorHandler');

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

    // create jwt - use UUID as external identifier for consistency
    const token = jwt.sign(
        {
            userId: user.userUuid, // expose UUID instead of internal integer id
            role: user.role,
            tckn: user.tckn,
        },
        process.env.JWT_SECRET,
        { expiresIn: '30m' } // token duration
    );

    return token;
};

module.exports = {
    registerUser,
    loginUser,
}
