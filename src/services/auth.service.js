const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { ApiError } = require('../api/middlewares/errorHandler');




/**
 * Handles business logic
 *
 *
 */

const registerUser = async (userData) => {

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const dateOfBirthObject = new Date(userData.dateOfBirth);

    // create user
    try {
        const newUser = await userRepository.createUser({ // userRepository handles error handling like 
            ...userData,
            password: hashedPassword,
            dateOfBirth: dateOfBirthObject,
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


    return token;
};

module.exports = {
    registerUser,
    loginUser,
}
