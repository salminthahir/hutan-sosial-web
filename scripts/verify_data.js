const path = require('path');
const { Sequelize, Op } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
    }
);

async function verifyData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected for verification.');

        // 1. Verify SocialForestPermits Years
        const [badPermits] = await sequelize.query(
            `SELECT count(*) as count FROM "SocialForestPermits" WHERE "permitYear" < 1990`
        );
        const badPermitCount = parseInt(badPermits[0].count);

        if (badPermitCount === 0) {
            console.log('✅ PASS: No permits with invalid years (< 1990) found.');
        } else {
            console.error(`❌ FAIL: Found ${badPermitCount} permits with invalid years!`);
        }

        // 2. Verify Commodities (Numeric)
        const [badCommodities] = await sequelize.query(
            `SELECT count(*) as count FROM "Commodities" WHERE name ~ '^\\d+$'`
        );
        const badCommCount = parseInt(badCommodities[0].count);

        if (badCommCount === 0) {
            console.log('✅ PASS: No numeric commodity names found.');
        } else {
            console.error(`❌ FAIL: Found ${badCommCount} numeric commodity names!`);
        }

        // 3. Verify Commodities (Typos)
        // Check for 'Rumout', 'Cemgleh', etc.
        const badNames = ['Rumout', 'Cemgleh', 'Mannga', 'gufasa'];
        let typoFail = false;
        for (const name of badNames) {
            const [res] = await sequelize.query(
                `SELECT count(*) as count FROM "Commodities" WHERE name ILIKE :name`,
                { replacements: { name } }
            );
            if (parseInt(res[0].count) > 0) {
                console.error(`❌ FAIL: Found typo commodity '${name}'!`);
                typoFail = true;
            }
        }
        if (!typoFail) {
            console.log('✅ PASS: No known typo commodities found.');
        }

        // 4. Verify Duplicates (Coklat vs Cokelat)
        const [coklat] = await sequelize.query(`SELECT count(*) as count FROM "Commodities" WHERE name ILIKE 'Coklat'`);
        const [cokelat] = await sequelize.query(`SELECT count(*) as count FROM "Commodities" WHERE name ILIKE 'Cokelat'`);

        if (parseInt(coklat[0].count) === 0 && parseInt(cokelat[0].count) > 0) {
            console.log('✅ PASS: "Coklat" (typo) is gone, "Cokelat" (correct) exists.');
        } else if (parseInt(coklat[0].count) > 0) {
            console.error('❌ FAIL: "Coklat" still exists!');
        }

        console.log('Verification Complete.');

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await sequelize.close();
    }
}

verifyData();
