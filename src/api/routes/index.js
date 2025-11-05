const express = require("express");
const authRouter = require("./auth.routes.js");


const router = express.Router();

router.use("/auth", authRouter);

module.exports = router;
