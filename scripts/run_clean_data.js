const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME || process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
);

async function runCleaning() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        const sqlPath = path.join(__dirname, 'clean_data.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by custom separator
        const statements = sql
            .split('/*_SPLIT_*/')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Found ${statements.length} statements to execute.`);

        // Use a transaction for safety
        const transaction = await sequelize.transaction();

        try {
            for (const stmt of statements) {
                if (stmt.toUpperCase() === 'BEGIN' || stmt.toUpperCase() === 'COMMIT') continue; // Manage transaction manually

                console.log(`Executing: ${stmt.substring(0, 50)}...`);
                await sequelize.query(stmt, { transaction });
            }
            await transaction.commit();
            console.log('Cleaning script executed successfully (Transaction Committed)!');
        } catch (err) {
            await transaction.rollback();
            console.error('Transaction Rolled Back due to error:', err);
            throw err;
        }

    } catch (error) {
        console.error('Error executing cleaning script:', error);
    } finally {
        await sequelize.close();
    }
}

runCleaning();
