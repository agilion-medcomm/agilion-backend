const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Parse DD.MM.YYYY and HH:MM into a Date object (UTC)
 * @param {string} dateStr - Date in DD.MM.YYYY format
 * @param {string} timeStr - Time in HH:MM format
 * @returns {Date} - Parsed Date object in UTC
 */
const parseAppointmentDateTime = (dateStr, timeStr) => {
    // Parse DD.MM.YYYY
    const [day, month, year] = dateStr.split('.').map(Number);
    // Parse HH:MM
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

module.exports = {
    findAppointmentsNeedingReminders,
    parseAppointmentDateTime, // Export for testing purposes
};

