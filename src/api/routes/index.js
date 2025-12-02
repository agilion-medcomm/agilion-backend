const express = require("express");
const authRouter = require("./auth.routes.js");
const appointmentRouter = require("./appointment.routes.js");
const leaveRequestRouter = require("./leaveRequest.routes.js");
const doctorRouter = require("./doctor.routes.js");
const patientRouter = require("./patient.routes.js");
const personnelRouter = require("./personnel.routes.js");
const contactRouter = require("./contact.routes.js");

const router = express.Router();

router.use("/auth", authRouter);
router.use("/appointments", appointmentRouter);
router.use("/leave-requests", leaveRequestRouter);
router.use("/doctors", doctorRouter);
router.use("/patients", patientRouter);
router.use("/personnel", personnelRouter);
router.use("/contact", contactRouter);

module.exports = router;
