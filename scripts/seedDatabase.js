#!/usr/bin/env node
/**
 * Database Seed Script
 * Creates test users for development and testing
 * 
 * Run with: node scripts/seedDatabase.js
 * Or: npm run db:seed
 * 
 * WARNING: This will create test data in your database.
 * Only run this on development/test environments!
 */

const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
dotenvExpand.expand(dotenv.config());

const { hashPassword } = require('../src/utils/passwordHelper');
const prisma = require('../src/config/db');

// ═══════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════

const TEST_PASSWORD = 'Test1234!';

const testUsers = {
    admin: {
        tckn: '99999999999',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@agilion.test',
        role: 'ADMIN',
        phoneNumber: '5550000001',
    },
    doctors: [
        {
            tckn: '11111111111',
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            email: 'ahmet.yilmaz@agilion.test',
            phoneNumber: '5551111111',
            specialization: 'Kardiyoloji',
        },
        {
            tckn: '11111111112',
            firstName: 'Fatma',
            lastName: 'Demir',
            email: 'fatma.demir@agilion.test',
            phoneNumber: '5551111112',
            specialization: 'Nöroloji',
        },
        {
            tckn: '11111111113',
            firstName: 'Mehmet',
            lastName: 'Kaya',
            email: 'mehmet.kaya@agilion.test',
            phoneNumber: '5551111113',
            specialization: 'Ortopedi',
        },
    ],
    patients: [
        {
            tckn: '22222222221',
            firstName: 'Ali',
            lastName: 'Öztürk',
            email: 'ali.ozturk@test.com',
            phoneNumber: '5552222221',
            dateOfBirth: new Date('1990-05-15'),
            address: 'İstanbul, Kadıköy',
            bloodType: 'A+',
        },
        {
            tckn: '22222222222',
            firstName: 'Ayşe',
            lastName: 'Şahin',
            email: 'ayse.sahin@test.com',
            phoneNumber: '5552222222',
            dateOfBirth: new Date('1985-03-20'),
            address: 'Ankara, Çankaya',
            bloodType: 'B-',
        },
        {
            tckn: '22222222223',
            firstName: 'Mustafa',
            lastName: 'Çelik',
            email: 'mustafa.celik@test.com',
            phoneNumber: '5552222223',
            dateOfBirth: new Date('1975-11-08'),
            address: 'İzmir, Karşıyaka',
            bloodType: 'O+',
        },
    ],
    cashier: {
        tckn: '33333333331',
        firstName: 'Zeynep',
        lastName: 'Arslan',
        email: 'zeynep.arslan@agilion.test',
        phoneNumber: '5553333331',
    },
    laborant: {
        tckn: '44444444441',
        firstName: 'Emre',
        lastName: 'Koç',
        email: 'emre.koc@agilion.test',
        phoneNumber: '5554444441',
    },
    cleaner: {
        tckn: '55555555551',
        firstName: 'Hasan',
        lastName: 'Yıldız',
        email: 'hasan.yildiz@agilion.test',
        phoneNumber: '5555555551',
    },
};

// ═══════════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function createAdmin(hashedPassword) {
    const data = testUsers.admin;
    
    const existing = await prisma.user.findUnique({ where: { tckn: data.tckn } });
    if (existing) {
        console.log(`  ⏭️  Admin already exists: ${data.email}`);
        return existing;
    }

    const admin = await prisma.admin.create({
        data: {
            user: {
                create: {
                    tckn: data.tckn,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: hashedPassword,
                    role: 'ADMIN',
                    phoneNumber: data.phoneNumber,
                    isEmailVerified: true,
                },
            },
        },
        include: { user: true },
    });

    console.log(`  ✅ Created Admin: ${admin.user.firstName} ${admin.user.lastName}`);
    return admin.user;
}

async function createDoctors(hashedPassword) {
    const created = [];
    
    for (const data of testUsers.doctors) {
        const existing = await prisma.user.findUnique({ where: { tckn: data.tckn } });
        if (existing) {
            console.log(`  ⏭️  Doctor already exists: ${data.email}`);
            created.push(existing);
            continue;
        }

        const doctor = await prisma.doctor.create({
            data: {
                specialization: data.specialization,
                user: {
                    create: {
                        tckn: data.tckn,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        password: hashedPassword,
                        role: 'DOCTOR',
                        phoneNumber: data.phoneNumber,
                        isEmailVerified: true,
                    },
                },
            },
            include: { user: true },
        });

        console.log(`  ✅ Created Doctor: ${doctor.user.firstName} ${doctor.user.lastName} (${data.specialization})`);
        created.push(doctor.user);
    }

    return created;
}

async function createPatients(hashedPassword) {
    const created = [];
    
    for (const data of testUsers.patients) {
        const existing = await prisma.user.findUnique({ where: { tckn: data.tckn } });
        if (existing) {
            console.log(`  ⏭️  Patient already exists: ${data.email}`);
            created.push(existing);
            continue;
        }

        const patient = await prisma.patient.create({
            data: {
                address: data.address,
                bloodType: data.bloodType,
                user: {
                    create: {
                        tckn: data.tckn,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        password: hashedPassword,
                        role: 'PATIENT',
                        phoneNumber: data.phoneNumber,
                        dateOfBirth: data.dateOfBirth,
                        isEmailVerified: true,
                    },
                },
            },
            include: { user: true },
        });

        console.log(`  ✅ Created Patient: ${patient.user.firstName} ${patient.user.lastName}`);
        created.push(patient.user);
    }

    return created;
}

async function createCashier(hashedPassword) {
    const data = testUsers.cashier;
    
    const existing = await prisma.user.findUnique({ where: { tckn: data.tckn } });
    if (existing) {
        console.log(`  ⏭️  Cashier already exists: ${data.email}`);
        return existing;
    }

    const cashier = await prisma.user.create({
        data: {
            tckn: data.tckn,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: hashedPassword,
            role: 'CASHIER',
            phoneNumber: data.phoneNumber,
            isEmailVerified: true,
        },
    });

    console.log(`  ✅ Created Cashier: ${cashier.firstName} ${cashier.lastName}`);
    return cashier;
}

async function createLaborant(hashedPassword) {
    const data = testUsers.laborant;
    
    const existing = await prisma.user.findUnique({ where: { tckn: data.tckn } });
    if (existing) {
        console.log(`  ⏭️  Laborant already exists: ${data.email}`);
        return existing;
    }

    const laborant = await prisma.laborant.create({
        data: {
            user: {
                create: {
                    tckn: data.tckn,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: hashedPassword,
                    role: 'LABORANT',
                    phoneNumber: data.phoneNumber,
                    isEmailVerified: true,
                },
            },
        },
        include: { user: true },
    });

    console.log(`  ✅ Created Laborant: ${laborant.user.firstName} ${laborant.user.lastName}`);
    return laborant.user;
}

async function createCleaner(hashedPassword) {
    const data = testUsers.cleaner;
    
    const existing = await prisma.user.findUnique({ where: { tckn: data.tckn } });
    if (existing) {
        console.log(`  ⏭️  Cleaner already exists: ${data.email}`);
        return existing;
    }

    const cleaner = await prisma.cleaner.create({
        data: {
            user: {
                create: {
                    tckn: data.tckn,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: hashedPassword,
                    role: 'CLEANER',
                    phoneNumber: data.phoneNumber,
                    isEmailVerified: true,
                },
            },
        },
        include: { user: true },
    });

    console.log(`  ✅ Created Cleaner: ${cleaner.user.firstName} ${cleaner.user.lastName}`);
    return cleaner.user;
}

async function createSampleAppointments(patients, doctors) {
    if (patients.length === 0 || doctors.length === 0) {
        console.log('  ⏭️  Skipping appointments - no patients or doctors');
        return;
    }

    // Get patient and doctor IDs from their profiles
    const patient = await prisma.patient.findUnique({ where: { userId: patients[0].id } });
    const doctor = await prisma.doctor.findUnique({ where: { userId: doctors[0].id } });

    if (!patient || !doctor) {
        console.log('  ⏭️  Skipping appointments - profiles not found');
        return;
    }

    // Check if appointments already exist
    const existingCount = await prisma.appointment.count();
    if (existingCount > 0) {
        console.log(`  ⏭️  Appointments already exist (${existingCount})`);
        return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = `${String(tomorrow.getDate()).padStart(2, '0')}.${String(tomorrow.getMonth() + 1).padStart(2, '0')}.${tomorrow.getFullYear()}`;

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterDate = `${String(dayAfter.getDate()).padStart(2, '0')}.${String(dayAfter.getMonth() + 1).padStart(2, '0')}.${dayAfter.getFullYear()}`;

    await prisma.appointment.createMany({
        data: [
            {
                patientId: patient.id,
                doctorId: doctor.id,
                date: tomorrowDate,
                time: '10:00',
                status: 'APPROVED',
            },
            {
                patientId: patient.id,
                doctorId: doctor.id,
                date: dayAfterDate,
                time: '14:30',
                status: 'APPROVED',
            },
        ],
    });

    console.log('  ✅ Created 2 sample appointments');
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function seed() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║          AGILION BACKEND - DATABASE SEEDER                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Safety check
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ Cannot run seed script in production!');
        process.exit(1);
    }

    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Test Password: ${TEST_PASSWORD}`);
    console.log();

    try {
        // Hash the common test password once
        console.log('🔐 Hashing password...');
        const hashedPassword = await hashPassword(TEST_PASSWORD);

        // Create users
        console.log('\n👤 Creating Admin...');
        await createAdmin(hashedPassword);

        console.log('\n👨‍⚕️ Creating Doctors...');
        const doctors = await createDoctors(hashedPassword);

        console.log('\n🏥 Creating Patients...');
        const patients = await createPatients(hashedPassword);

        console.log('\n💰 Creating Cashier...');
        await createCashier(hashedPassword);

        console.log('\n🔬 Creating Laborant...');
        await createLaborant(hashedPassword);

        console.log('\n🧹 Creating Cleaner...');
        await createCleaner(hashedPassword);

        console.log('\n📅 Creating Sample Appointments...');
        await createSampleAppointments(patients, doctors);

        // Summary
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('\n✅ Database seeding completed!\n');
        console.log('📋 Test Credentials:');
        console.log('────────────────────');
        console.log(`   Password (all users): ${TEST_PASSWORD}`);
        console.log();
        console.log('   Admin:    TCKN 99999999999');
        console.log('   Doctor 1: TCKN 11111111111 (Kardiyoloji)');
        console.log('   Doctor 2: TCKN 11111111112 (Nöroloji)');
        console.log('   Doctor 3: TCKN 11111111113 (Ortopedi)');
        console.log('   Patient:  TCKN 22222222221');
        console.log('   Cashier:  TCKN 33333333331');
        console.log('   Laborant: TCKN 44444444441');
        console.log('   Cleaner:  TCKN 55555555551');
        console.log();
        console.log('💡 Run "npm run test:api" to verify the API is working.\n');

    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run seeder
seed();
