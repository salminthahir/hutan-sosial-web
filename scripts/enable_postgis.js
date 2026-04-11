const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize } = require('sequelize');
const config = require('../config/config.js')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function enablePostGIS() {
    try {
        console.log('Connecting to Supabase...');
        await sequelize.authenticate();
        console.log('Connection established.');

        console.log('Enabling PostGIS extension...');
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
        console.log('PostGIS extension enabled successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Failed to enable PostGIS:', error);
        process.exit(1);
    }
}

enablePostGIS();
