const fs = require('fs');
const { Sequelize, DataTypes, Op } = require('sequelize');
const updates = JSON.parse(fs.readFileSync('/tmp/extracted_links.json'));

const sequelize = new Sequelize('postgres', 'postgres', 'Eastnesia0708', {
    host: 'db.ezdbeshyiswrguzxyhat.supabase.co',
    port: 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const Permit = sequelize.define('SocialForestPermits', {
    permitNumber: DataTypes.TEXT,
    pdfUrl: DataTypes.STRING,
    hasPdfDoc: DataTypes.BOOLEAN
}, { tableName: 'SocialForestPermits', timestamps: false });

async function run() {
    await sequelize.authenticate();
    let updatedCount = 0;

    for (const update of updates) {
        let baseSk = update.nomorIzin.split(/tanggal/i)[0].trim();
        baseSk = baseSk.replace(/^SK\.\s+/, 'SK.');

        const permit = await Permit.findOne({
            where: { permitNumber: { [Op.iLike]: `%${baseSk}%` } }
        });

        if (permit) {
            permit.pdfUrl = update.hyperlink;
            permit.hasPdfDoc = true;
            await permit.save();
            updatedCount++;
            console.log(`Updated ID ${permit.id} -> ${baseSk}`);
        } else {
            console.log(`NOT FOUND in DB: ${baseSk}`);
        }
    }

    console.log(`=========================`);
    console.log(`PROD DB Result: Updated ${updatedCount} out of ${updates.length} links.`);
}

run().catch(console.error).finally(() => process.exit(0));
