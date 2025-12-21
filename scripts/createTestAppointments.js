#!/usr/bin/env node
/**
 * Create Test Appointments Script
 * Creates test appointments for testing the reminder email system
 * 
 * Usage:
 *   node scripts/createTestAppointments.js <email1> [email2] [email3] ...
 * 
 * Examples:
 *   node scripts/createTestAppointments.js yunusemremanav@gmail.com
 *   node scripts/createTestAppointments.js user1@test.com user2@test.com
 * 
 * This script creates appointments scheduled for ~24 hours from now.
 * If users don't exist, they will be created as PATIENT role.
 * If users exist but don't have patient records, patient records will be created.
 */

const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
dotenvExpand.expand(dotenv.config());

const prisma = require('../src/config/db');
const { hashPassword } = require('../src/utils/passwordHelper');

// Get emails from command line arguments
const TEST_EMAILS = process.argv.slice(2);

// Validate that at least one email was provided
if (TEST_EMAILS.length === 0) {
    console.error('\n❌ Error: No email addresses provided!\n');
    console.log('Usage: node scripts/createTestAppointments.js <email1> [email2] [email3] ...\n');
    console.log('Examples:');
    console.log('  node scripts/createTestAppointments.js yunusemremanav@gmail.com');
    console.log('  node scripts/createTestAppointments.js user1@test.com user2@test.com\n');
    process.exit(1);
}

/**
 * Format date to DD.MM.YYYY
 */
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

/**
 * Format time to HH:MM
 */
const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Create or get test users
 */
const createTestUsers = async () => {
    const users = [];
    
    for (const email of TEST_EMAILS) {
        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: { patient: true },
        });

        if (!user) {
            console.log(`Creating user: ${email}`);
            
            // Generate a unique TCKN for testing
            const tckn = String(Math.floor(10000000000 + Math.random() * 90000000000));
            const hashedPassword = await hashPassword('Test1234!');
            
            user = await prisma.user.create({
                data: {
                    email,
                    tckn,
                    firstName: email.split('@')[0].split('.')[0] || 'Test',
                    lastName: 'User',
                    password: hashedPassword,
                    role: 'PATIENT',
                    phoneNumber: `555${String(Math.floor(1000000 + Math.random() * 9000000))}`,
                    isEmailVerified: true,
                    patient: {
                        create: {
                            address: 'Test Address',
                            bloodType: 'A+',
                        },
                    },
                },
                include: { patient: true },
            });
            
            console.log(`✓ Created user: ${email} (ID: ${user.id})`);
        } else {
            console.log(`✓ User exists: ${email} (ID: ${user.id})`);
            
            // Check if user has a patient record, create if not
            if (!user.patient) {
                console.log(`  → Creating patient record for ${email}`);
                const patient = await prisma.patient.create({
                    data: {
                        userId: user.id,
                        address: 'Test Address',
                        bloodType: 'A+',
                    },
                });
                user.patient = patient;
                console.log(`  ✓ Patient record created`);
            }
        }
        
        users.push(user);
    }
    
    return users;
};

/**
 * Get or create a test doctor
 */
const getTestDoctor = async () => {
    let doctor = await prisma.doctor.findFirst({
        include: { user: true },
    });

    if (!doctor) {
        console.log('Creating test doctor...');
        
        const tckn = String(Math.floor(10000000000 + Math.random() * 90000000000));
        const hashedPassword = await hashPassword('Test1234!');
        
        const doctorUser = await prisma.user.create({
            data: {
                email: 'test.doctor@agilion.test',
                tckn,
                firstName: 'Dr. Test',
                lastName: 'Doctor',
                password: hashedPassword,
                role: 'DOCTOR',
                phoneNumber: `555${String(Math.floor(1000000 + Math.random() * 9000000))}`,
                isEmailVerified: true,
                doctor: {
                    create: {
                        specialization: 'Test Uzmanlığı',
                    },
                },
            },
            include: { doctor: true },
        });
        
        doctor = doctorUser.doctor;
        console.log(`✓ Created doctor: ${doctorUser.email}`);
    } else {
        console.log(`✓ Using existing doctor: ${doctor.user.email}`);
    }

    return doctor;
};

/**
 * Create test appointments
 */
const createTestAppointments = async () => {
    console.log('\n📅 Creating Test Appointments for Reminder System\n');
    console.log('='.repeat(60));

    try {
        // Create/get test users
        const users = await createTestUsers();
        
        // Get test doctor
        const doctor = await getTestDoctor();

        console.log('\n' + '='.repeat(60));
        console.log('\n📌 Creating Appointments (~24 hours from now):\n');

        // Calculate date/time for ~24 hours from now
        const appointmentDateTime = new Date();
        appointmentDateTime.setHours(appointmentDateTime.getHours() + 24);
        appointmentDateTime.setMinutes(0); // Round to the hour for cleaner times

        const dateStr = formatDate(appointmentDateTime);
        const timeStr = formatTime(appointmentDateTime);

        const appointments = [];

        for (const user of users) {
            // Check if appointment already exists
            const existing = await prisma.appointment.findFirst({
                where: {
                    patientId: user.patient.id,
                    date: dateStr,
                    time: timeStr,
                },
            });

            if (existing) {
                console.log(`⚠️  Appointment already exists for ${user.email} on ${dateStr} at ${timeStr}`);
                appointments.push(existing);
                continue;
            }

            const appointment = await prisma.appointment.create({
                data: {
                    patientId: user.patient.id,
                    doctorId: doctor.id,
                    date: dateStr,
                    time: timeStr,
                    status: 'APPROVED',
                    reminderSent: false,
                },
            });

            appointments.push(appointment);
            console.log(`✓ Created appointment for ${user.email}`);
            console.log(`  → Date: ${dateStr}, Time: ${timeStr}`);
            console.log(`  → Appointment ID: ${appointment.id}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ Test Data Created Successfully!\n');
        console.log('Summary:');
        console.log(`  - Patients: ${users.length}`);
        console.log(`  - Doctor: ${doctor.user.firstName} ${doctor.user.lastName}`);
        console.log(`  - Appointments: ${appointments.length}`);
        console.log(`  - Appointment Date/Time: ${dateStr} ${timeStr}`);
        console.log('\nTo test the reminder system, run:');
        console.log('  node scripts/testReminderJob.js\n');

    } catch (error) {
        console.error('\n❌ Error creating test appointments:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// Run the script
createTestAppointments();

