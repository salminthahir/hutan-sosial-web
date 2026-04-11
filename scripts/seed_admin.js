/**
 * Seed Admin Script
 * Usage: node scripts/seed_admin.js --email admin@hutankita.id --password secret
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { AdminUsers } = require('../models');

async function run() {
    const args = process.argv.slice(2);
    let email = 'admin@hutan-sosial-go.id';
    let password = 'admin';
    let username = 'Super Admin';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--email' && args[i + 1]) email = args[i + 1];
        if (args[i] === '--password' && args[i + 1]) password = args[i + 1];
        if (args[i] === '--username' && args[i + 1]) username = args[i + 1];
    }

    try {
        console.log(`Checking for existing admin with email: ${email}...`);
        const existing = await AdminUsers.findOne({ where: { email } });

        if (existing) {
            console.log(`Admin ${email} already exists. Updating password...`);
            existing.passwordHash = await bcrypt.hash(password, 10);
            await existing.save();
            console.log('Password updated successfully!');
            process.exit(0);
        }

        console.log(`Creating new superadmin...`);
        const passwordHash = await bcrypt.hash(password, 10);

        await AdminUsers.create({
            username,
            email,
            passwordHash,
            role: 'superadmin',
            isActive: true
        });

        console.log('Superadmin created successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

run();
