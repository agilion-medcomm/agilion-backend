const authService = require("../../services/auth.service");
const { ApiError } = require("../middlewares/errorHandler");

const register = async (req, res, next) => {

    try {
        // Call authservice here
        const user = await authService.registerUser(req.body);

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully.',
            data: {
                userId: user.id, // Or 'userId: user.userId' depending on your model
                email: user.email,
                firstName: user.firstName,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {

    try {
        const { tckn, password } = req.body;

        const token = await authService.loginUser(tckn, password);

        res.status(200).json({
            status: 'success',
            message: 'Login successful.',
            data: {
                token: token,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
};
