require('dotenv').config();
const db = require('../models');

async function sync() {
    try {
        console.log('Syncing AdminUsers table...');
        await db.AdminUsers.sync({ alter: true });
        console.log('AdminUsers synced successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing AdminUsers:', error);
        process.exit(1);
    }
}

sync();
