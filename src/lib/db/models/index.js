'use strict';

const Sequelize = require('sequelize');
const pg = require('pg');

// Inline config to avoid Turbopack require() path resolution issues
const isLocalDB = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
const dbConfig = {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: (process.env.DB_HOST || '').includes('pooler.supabase.com') ? 6543 : (process.env.DB_PORT || 5432),
    dialect: 'postgres',
    logging: false,
    dialectModule: pg,
    dialectOptions: isLocalDB ? {} : {
        ssl: { require: true, rejectUnauthorized: false }
    },
    pool: {
        max: 5, // Keep pool small for serverless
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

const db = {};

// Prevent connection leaks during Next.js hot reloads
let sequelize;
if (process.env.NODE_ENV === 'production') {
    sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
} else {
    if (!global.sequelize) {
        global.sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
    }
    sequelize = global.sequelize;
}

// Custom Model Loading
// We group models in files, so we manually import them

// 1. Wilayah & Lembaga
const regionModels = require('./Region')(sequelize, Sequelize.DataTypes);
const institutionModels = require('./Institution')(sequelize, Sequelize.DataTypes);

// Admin Users
const adminModels = require('./Admin')(sequelize, Sequelize.DataTypes);

// 2. Izin & Komoditas Dasar
const permitModels = require('./Permit')(sequelize, Sequelize.DataTypes);
const commodityModels = require('./Commodity')(sequelize, Sequelize.DataTypes);

// 3. Modul Lanjutan (Advanced Modules)
const biophysicalModels = require('./Biophysical')(sequelize, Sequelize.DataTypes);
const derivedProductModels = require('./DerivedProduct')(sequelize, Sequelize.DataTypes);
const socialModels = require('./Social')(sequelize, Sequelize.DataTypes);
const marketModels = require('./Market')(sequelize, Sequelize.DataTypes);
const riskModels = require('./Risk')(sequelize, Sequelize.DataTypes);
const priorityModels = require('./Priority')(sequelize, Sequelize.DataTypes);

// KUPS model
const kupsModel = require('./KUPS')(sequelize, Sequelize.DataTypes);

// Combine all models
const allModels = {
    ...regionModels,
    ...institutionModels,
    ...permitModels,
    ...commodityModels,
    ...biophysicalModels,
    ...derivedProductModels,
    ...socialModels,
    ...marketModels,
    ...riskModels,
    ...priorityModels,
    ...adminModels,
    KUPS: kupsModel
};

// Add to db object
Object.keys(allModels).forEach(modelName => {
    db[modelName] = allModels[modelName];
});

// Run associate if exists
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
