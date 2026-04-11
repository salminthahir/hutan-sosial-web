const db = require('../models');
(async () => {
    try {
        const permits = await db.SocialForestPermits.findAll({
            include: [{
                model: db.Villages,
                as: 'village',
                include: [{
                    model: db.Districts,
                    as: 'district',
                    include: [{
                        model: db.Regencies,
                        as: 'regency'
                    }]
                }]
            }]
        });

        const missingRegion = permits.filter(p => !p.village || !p.village.district || !p.village.district.regency);

        console.log('Permits with missing region info:', missingRegion.length);
        missingRegion.forEach(p => {
            console.log(`- ID: ${p.id} | SK: ${p.permitNumber} | Village ID: ${p.villageId} | Village: ${p.village?.name || 'Null'} | District: ${p.village?.district?.name || 'Null'} | Regency: ${p.village?.district?.regency?.name || 'Null'}`);
        });

    } catch (e) { console.error(e); }
    process.exit(0);
})();
