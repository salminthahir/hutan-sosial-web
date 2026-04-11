const fs = require('fs');
const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize('hutan_kita_db', 'hutan_kita_user', 'hutan_kita_password', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

const Institutions = sequelize.define('Institutions', {
    shortName: DataTypes.STRING,
    fullName: DataTypes.STRING
}, { timestamps: false });

const Villages = sequelize.define('Villages', {
    name: DataTypes.STRING,
    districtId: DataTypes.INTEGER
}, { timestamps: false });

const Districts = sequelize.define('Districts', {
    name: DataTypes.STRING,
    regencyId: DataTypes.INTEGER
}, { timestamps: false });

const Regencies = sequelize.define('Regencies', {
    name: DataTypes.STRING
}, { timestamps: false });

const Permit = sequelize.define('SocialForestPermits', {
    permitNumber: DataTypes.TEXT,
    pdfUrl: DataTypes.STRING,
    institutionId: DataTypes.INTEGER,
    villageId: DataTypes.INTEGER
}, { tableName: 'SocialForestPermits', timestamps: false });

Permit.belongsTo(Institutions, { foreignKey: 'institutionId' });
Permit.belongsTo(Villages, { foreignKey: 'villageId' });
Villages.belongsTo(Districts, { foreignKey: 'districtId' });
Districts.belongsTo(Regencies, { foreignKey: 'regencyId' });

async function run() {
    await sequelize.authenticate();
    const permits = await Permit.findAll({
        where: {
            pdfUrl: { [Op.ne]: null, [Op.not]: '' }
        },
        include: [
            { model: Institutions },
            {
                model: Villages,
                include: [{
                    model: Districts,
                    include: [Regencies]
                }]
            }
        ],
        order: [['id', 'DESC']]
    });

    let md = `# Daftar SK yang Dapat Diunduh (${permits.length} Izin)\n\n`;
    md += `Berikut adalah daftar seluruh izin yang sudah dilengkapi dengan Hyperlink Google Drive untuk pengunduhan dokumen PDF SK langsung, berdasarkan data hasil sinkronisasi terbaru.\n\n`;
    md += `| No | Nomor SK (Izin) | Nama Lembaga | Desa | Kecamatan | Kabupaten/Kota |\n`;
    md += `|---|---|---|---|---|---|\n`;

    permits.forEach((p, i) => {
        const instName = p.Institution ? (p.Institution.shortName || p.Institution.fullName) : '-';
        const village = p.Village ? p.Village.name : '-';
        const dist = p.Village && p.Village.District ? p.Village.District.name : '-';
        const reg = p.Village && p.Village.District && p.Village.District.Regency ? p.Village.District.Regency.name : '-';
        
        md += `| ${i+1} | ${p.permitNumber} | ${instName} | ${village} | ${dist} | ${reg} |\n`;
    });

    fs.writeFileSync('/Users/macbooksale/.gemini/antigravity/brain/8823732d-b355-40b7-b000-63cd689f9f4c/downloadable_sk.md', md);
    console.log(`Exported ${permits.length} permits.`);
}

run().catch(console.error).finally(() => process.exit(0));
