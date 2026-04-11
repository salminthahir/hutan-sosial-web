const {
    sequelize,
    Provinces, Regencies, Districts, Villages, SocialForestPermits
} = require('../models');

async function fixMissingRegions() {
    const t = await sequelize.transaction();
    try {
        // Find permits with no villageId
        const permits = await SocialForestPermits.findAll({
            where: { villageId: null },
            transaction: t
        });

        console.log(`Found ${permits.length} permits with null villageId`);

        // Known regencies for these 3 specific permits from the Excel file
        const permKabs = {
            'SK.134/Menhut-II/2010': 'Pulau Morotai',
            'SK. No 60 Tahun 2010': 'Halmahera Barat',
            'SK. 171 Tahun 2009': 'Halmahera Selatan'
        };

        const province = await Provinces.findOne({ where: { name: 'Maluku Utara' }, transaction: t });

        for (const p of permits) {
            const regName = permKabs[p.permitNumber];
            if (!regName) {
                console.log(`Skipping permit ${p.permitNumber} (no known regency)`);
                continue;
            }

            console.log(`Fixing permit ${p.permitNumber} -> ${regName}`);

            // Ensure Regency
            const [reg] = await Regencies.findOrCreate({
                where: { name: regName },
                defaults: { name: regName, type: 'Kabupaten', provinceId: province.id },
                transaction: t
            });

            // Ensure District "Tidak Diketahui"
            const [dist] = await Districts.findOrCreate({
                where: { name: 'Tidak Diketahui', regencyId: reg.id },
                defaults: { name: 'Tidak Diketahui', regencyId: reg.id },
                transaction: t
            });

            // Ensure Village "Tidak Diketahui"
            const [vil] = await Villages.findOrCreate({
                where: { name: 'Tidak Diketahui', districtId: dist.id },
                defaults: { name: 'Tidak Diketahui', districtId: dist.id },
                transaction: t
            });

            // Update Permit
            await p.update({ villageId: vil.id }, { transaction: t });
            console.log(`  -> Assigned to Village ID: ${vil.id}`);
        }

        await t.commit();
        console.log('✅ Fix applied successfully!');

    } catch (e) {
        await t.rollback();
        console.error('❌ Failed:', e);
    }
    process.exit(0);
}

fixMissingRegions();
