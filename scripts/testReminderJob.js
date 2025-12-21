#!/usr/bin/env node
/**
 * Test Reminder Job Script
 * Manually triggers the appointment reminder email system
 * WITHOUT the 23-24 hour window check (for testing purposes)
 * 
 * Usage:
 *   node scripts/testReminderJob.js                    # Test all pending appointments
 *   node scripts/testReminderJob.js <email>            # Test specific email
 *   node scripts/testReminderJob.js <email1> <email2>  # Test multiple emails
 * 
 * This script will send reminder emails to appointments with:
 * - status: APPROVED
 * - reminderSent: false
 * - Optionally filtered by patient email(s)
 */

const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
dotenvExpand.expand(dotenv.config());

const prisma = require('../src/config/db');
const { sendAppointmentReminderEmail } = require('../src/services/email.service');
const { parseAppointmentDateTime } = require('../src/jobs/reminderJob');
const logger = require('../src/utils/logger');

// Get optional email filter from command line arguments
const filterEmails = process.argv.slice(2);

/**
 * Test the reminder job - sends to ALL pending appointments regardless of time
 */
const testReminderJob = async () => {
    console.log('\n🧪 Testing Appointment Reminder System\n');
    console.log('='.repeat(60));
    console.log('⚠️  NOTE: This bypasses the 23-24 hour window check');
    console.log('='.repeat(60));

    if (filterEmails.length > 0) {
        console.log(`📧 Filtering by email(s): ${filterEmails.join(', ')}`);
        console.log('='.repeat(60));
    }

    try {
        // Build where clause
        const whereClause = {
            status: 'APPROVED',
            reminderSent: false,
        };

        // If emails are provided, filter by them
        if (filterEmails.length > 0) {
            whereClause.patient = {
                user: {
                    email: {
                        in: filterEmails,
                    },
                },
            };
        }

        // Find all APPROVED appointments that haven't received reminders
        const appointments = await prisma.appointment.findMany({
            where: whereClause,
            include: {
                patient: {
                    include: {
                        user: true,
                    },
                },
                doctor: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        console.log(`\n📋 Found ${appointments.length} appointment(s) to process\n`);

        if (appointments.length === 0) {
            console.log('ℹ️  No appointments found. Create some first with:');
            console.log('   node scripts/createTestAppointments.js <email>\n');
            console.log('Or test without email filter:');
            console.log('   node scripts/testReminderJob.js\n');
            return;
        }

        let successCount = 0;
        let failureCount = 0;

        // Process each appointment
        for (const appointment of appointments) {
            try {
                const patientUser = appointment.patient.user;
                const doctorUser = appointment.doctor.user;

                console.log(`\n📧 Processing Appointment #${appointment.id}:`);
                console.log(`   Patient: ${patientUser.firstName} ${patientUser.lastName}`);
                console.log(`   Email: ${patientUser.email}`);
                console.log(`   Doctor: ${doctorUser.firstName} ${doctorUser.lastName}`);
                console.log(`   Date: ${appointment.date}`);
                console.log(`   Time: ${appointment.time}`);

                // Parse appointment date/time
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
                console.log(`   Sending email...`);
                await sendAppointmentReminderEmail(
                    patientUser.email,
                    appointmentDetails
                );

                // Update reminderSent flag
                await prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { reminderSent: true },
                });

                successCount++;
                console.log(`   ✅ Email sent successfully!`);
                console.log(`   ✅ Updated reminderSent flag to true`);

            } catch (error) {
                failureCount++;
                console.error(`   ❌ Failed to send reminder:`, error.message);
                logger.error(`Failed to send reminder for appointment ${appointment.id}`, error);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Test Results:');
        console.log(`   Total Processed: ${appointments.length}`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${failureCount}`);
        console.log('\n='.repeat(60));

        if (successCount > 0) {
            console.log('\n✅ Check your email inbox for reminder emails!\n');
        }

        if (failureCount > 0) {
            console.log('\n⚠️  Some emails failed. Check:');
            console.log('   - EMAIL_ENABLED=true in .env');
            console.log('   - EMAIL_USER and EMAIL_PASSWORD are set');
            console.log('   - Email service credentials are correct\n');
        }

    } catch (error) {
        console.error('\n❌ Error running test:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// Run the test
testReminderJob();

