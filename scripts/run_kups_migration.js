// Run the KUPS expansion migration directly
const { Sequelize } = require('sequelize');
const pg = require('pg');

const dbConfig = {
    username: process.env.DB_USERNAME || 'hutan_kita_user',
    password: process.env.DB_PASSWORD || 'hutan_kita_password',
    database: process.env.DB_NAME || 'hutan_kita_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    dialectModule: pg,
};

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected\n');

        const qi = sequelize.getQueryInterface();

        // Check which columns already exist
        const tableDesc = await qi.describeTable('KUPS');
        console.log('Current KUPS columns:', Object.keys(tableDesc).join(', '));
        console.log();

        const columnsToAdd = [
            { name: 'establishedYear', type: Sequelize.INTEGER, comment: 'Tahun Pembentukan KUPS' },
            { name: 'skNumber', type: Sequelize.STRING, comment: 'Nomor SK KUPS' },
            { name: 'businessType', type: Sequelize.TEXT, comment: 'Jenis Usaha detail' },
            { name: 'cluster', type: Sequelize.STRING, comment: 'Klaster usaha' },
            { name: 'phoneNumber', type: Sequelize.STRING, comment: 'Nomor kontak ketua' },
            { name: 'goldUpgradeYear', type: Sequelize.INTEGER, comment: 'Tahun peningkatan Gold' },
            { name: 'address', type: Sequelize.TEXT, comment: 'Alamat lengkap' },
        ];

        for (const col of columnsToAdd) {
            if (tableDesc[col.name]) {
                console.log(`  ⏭️  Column "${col.name}" already exists — skipped`);
            } else {
                await qi.addColumn('KUPS', col.name, {
                    type: col.type,
                    allowNull: true,
                    comment: col.comment
                });
                console.log(`  ✅ Added column "${col.name}"`);
            }
        }

        // Change commodities to TEXT if it's still VARCHAR
        if (tableDesc.commodities && tableDesc.commodities.type !== 'TEXT') {
            await qi.changeColumn('KUPS', 'commodities', {
                type: Sequelize.TEXT,
                allowNull: true
            });
            console.log('  ✅ Changed "commodities" from STRING to TEXT');
        } else {
            console.log('  ⏭️  "commodities" already TEXT or unchanged');
        }

        // Verify
        const newDesc = await qi.describeTable('KUPS');
        console.log('\n✅ Final KUPS columns:', Object.keys(newDesc).join(', '));
        console.log(`   Total: ${Object.keys(newDesc).length} columns`);

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await sequelize.close();
    }
}

runMigration();
