require('dotenv').config({ path: '.env.production' });

// Override pooler settings with direct database connection settings
process.env.DB_HOST = 'db.ezdbeshyiswrguzxyhat.supabase.co';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'postgres'; // Pooler uses postgres.[project_ref], direct uses postgres

const db = require('../models');

async function sync() {
    try {
        console.log('Synchronizing all models to production database with alter: true USING DIRECT DB CONNECTION...');
        await db.sequelize.sync({ alter: true });
        console.log('Schema alignment complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error synchronizing:', error);
        process.exit(1);
    }
}

sync();
