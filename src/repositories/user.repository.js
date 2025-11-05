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
 * */
const createUser = async (userData) => {
    return prisma.user.create({
        data: userData,
    });
};

module.exports = {
    findUserByTckn,
    createUser,
};
