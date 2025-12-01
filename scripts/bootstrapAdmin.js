/**
 * Bootstrap script to create initial admin user
 * Run with: node scripts/bootstrapAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/config/db');

async function bootstrapAdmin() {
    const tckn = process.env.INITIAL_ADMIN_TCKN || '99999999999';
    const email = process.env.INITIAL_ADMIN_EMAIL || 'admin@agilion.local';
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'Admin123!';
    const firstName = process.env.INITIAL_ADMIN_FIRSTNAME || 'Admin';
    const lastName = process.env.INITIAL_ADMIN_LASTNAME || 'User';

    try {
        // Check if admin already exists
        const existing = await prisma.user.findUnique({
            where: { tckn },
        });

        if (existing) {
            console.log('❌ Admin with this TCKN already exists.');
            console.log(`   TCKN: ${tckn}`);
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user and admin profile
        const admin = await prisma.admin.create({
            data: {
                user: {
                    create: {
                        tckn,
                        firstName,
                        lastName,
                        email,
                        password: hashedPassword,
                        role: 'ADMIN',
                        isEmailVerified: true,
                    },
                },
            },
            include: {
                user: true,
            },
        });

        console.log('✅ Initial admin created successfully!');
        console.log(`   Name: ${admin.user.firstName} ${admin.user.lastName}`);
        console.log(`   TCKN: ${admin.user.tckn}`);
        console.log(`   Email: ${admin.user.email}`);
        console.log(`   Password: ${password}`);
        console.log('\n⚠️  Please change the password after first login!');
        
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

bootstrapAdmin();
