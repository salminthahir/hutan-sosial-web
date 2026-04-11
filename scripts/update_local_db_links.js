const fs = require('fs');
const { Sequelize, DataTypes, Op } = require('sequelize');
const updates = JSON.parse(fs.readFileSync('/tmp/extracted_links.json'));

const sequelize = new Sequelize('hutan_kita_db', 'hutan_kita_user', 'hutan_kita_password', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
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
        // Strip "tanggal ..." part
        let baseSk = update.nomorIzin.split(/tanggal/i)[0].trim();
        // Remove rogue spaces in SK header e.g. "SK. 123" -> "SK.123"
        baseSk = baseSk.replace(/^SK\.\s+/, 'SK.');

        const permit = await Permit.findOne({
            where: {
                permitNumber: {
                    [Op.iLike]: `%${baseSk}%`
                }
            }
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
    console.log(`LOCAL DB Result: Updated ${updatedCount} out of ${updates.length} links.`);
}

run().catch(console.error).finally(() => process.exit(0));
