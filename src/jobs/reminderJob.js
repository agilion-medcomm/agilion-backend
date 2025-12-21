const prisma = require('../config/db');
const cron = require('node-cron');
const logger = require('../utils/logger');
const { sendAppointmentReminderEmail } = require('../services/email.service');
const {
    parseAppointmentDate,
    validateTimeFormat,
    validateAppointmentDateFormat,
} = require('../utils/dateTimeValidator');

/**
 * Parse DD.MM.YYYY and HH:MM into a Date object (UTC)
 * Uses centralized date/time validation utilities
 * @param {string} dateStr - Date in DD.MM.YYYY format
 * @param {string} timeStr - Time in HH:MM format
 * @returns {Date} - Parsed Date object in UTC
 * @throws {Error} - If date or time format is invalid
 */
const parseAppointmentDateTime = (dateStr, timeStr) => {
    // Validate formats using centralized utilities
    if (!validateAppointmentDateFormat(dateStr)) {
        throw new Error(`Invalid date format: ${dateStr}. Expected DD.MM.YYYY`);
    }
    
    if (!validateTimeFormat(timeStr)) {
        throw new Error(`Invalid time format: ${timeStr}. Expected HH:MM`);
    }
    
    // Parse date using centralized utility
    const { day, month, year } = parseAppointmentDate(dateStr);
    
    // Parse time
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create date in UTC
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
};

/**
 * Find appointments that need 24-hour reminder emails
 * Finds appointments where:
 * - status is 'APPROVED'
 * - reminderSent is false
 * - appointmentDate is between 23 and 24 hours from now
 * 
 * @returns {Promise<Array>} - Array of appointments with patient and doctor info
 */
const findAppointmentsNeedingReminders = async () => {
    try {
        // Get all APPROVED appointments that haven't received reminders
        const appointments = await prisma.appointment.findMany({
            where: {
                status: 'APPROVED',
                reminderSent: false,
            },
            include: {
                patient: {
                    include: {
                        user: true, // Get patient's user info (email, name)
                    },
                },
                doctor: {
                    include: {
                        user: true, // Get doctor's user info (name)
                    },
                },
            },
        });

        // Current time
        const now = new Date();
        
        // 23 hours from now (in milliseconds)
        const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        
        // 24 hours from now (in milliseconds)
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Filter appointments that fall within the 23-24 hour window
        const appointmentsInWindow = appointments.filter((appointment) => {
            try {
                // Parse the appointment date and time
                const appointmentDateTime = parseAppointmentDateTime(
                    appointment.date,
                    appointment.time
                );

                // Check if appointment is in the 23-24 hour window
                return (
                    appointmentDateTime >= twentyThreeHoursFromNow &&
                    appointmentDateTime <= twentyFourHoursFromNow
                );
            } catch (error) {
                logger.error(
                    `Failed to parse date/time for appointment ${appointment.id}`,
                    error
                );
                return false;
            }
        });

        logger.info(
            `Found ${appointmentsInWindow.length} appointments needing reminders (out of ${appointments.length} total pending)`
        );

        return appointmentsInWindow;
    } catch (error) {
        logger.error('Error finding appointments needing reminders', error);
        throw error;
    }
};

/**
 * Process and send reminder emails for appointments
 * Iterates through appointments, sends emails, and updates reminderSent flag
 */
const processAppointmentReminders = async () => {
    try {
        logger.info('Starting appointment reminder job...');
        
        const appointments = await findAppointmentsNeedingReminders();
        
        if (appointments.length === 0) {
            logger.info('No appointments need reminders at this time.');
            return;
        }

        let successCount = 0;
        let failureCount = 0;

        // Process each appointment individually with error handling
        for (const appointment of appointments) {
            try {
                const patientUser = appointment.patient.user;
                const doctorUser = appointment.doctor.user;

                // Parse appointment date/time for email display
                const appointmentDateTime = parseAppointmentDateTime(
                    appointment.date,
                    appointment.time
                );

                // Prepare email details
                const appointmentDetails = {
                    patientFirstName: patientUser.firstName,
                    patientLastName: patientUser.lastName,
                    doctorName: `${doctorUser.firstName} ${doctorUser.lastName}`,
                    department: appointment.doctor.specialization,
                    appointmentDateTime: appointmentDateTime,
                };

                // Send reminder email
                await sendAppointmentReminderEmail(
                    patientUser.email,
                    appointmentDetails
                );

                // Update reminderSent flag ONLY after successful email send
                await prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { reminderSent: true },
                });

                successCount++;
                logger.info(
                    `Reminder sent for appointment ${appointment.id} (Patient: ${patientUser.email})`
                );
            } catch (error) {
                failureCount++;
                logger.error(
                    `Failed to send reminder for appointment ${appointment.id}`,
                    error
                );
                // Continue processing other appointments despite this failure
            }
        }

        logger.info(
            `Appointment reminder job completed. Success: ${successCount}, Failures: ${failureCount}`
        );
    } catch (error) {
        logger.error('Error in appointment reminder job', error);
    }
};

/**
 * Initialize the cron job for appointment reminders
 * Runs every hour (0 * * * *)
 */
const initializeReminderCronJob = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        logger.info('Appointment reminder cron job triggered');
        await processAppointmentReminders();
    });

    logger.info('Appointment reminder cron job initialized (runs hourly)');
};

module.exports = {
    findAppointmentsNeedingReminders,
    parseAppointmentDateTime, // Export for testing purposes
    processAppointmentReminders,
    initializeReminderCronJob,
};

