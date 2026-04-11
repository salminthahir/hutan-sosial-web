require('dotenv').config({ path: '.env.local' });
const db = require('../src/lib/db/models');
const fs = require('fs');

async function run() {
    try {
        await db.sequelize.authenticate();

        const permits = await db.SocialForestPermits.findAll({
            include: [
                { model: db.Institutions, as: 'institution', include: [{ model: db.InstitutionMembers, as: 'members' }] },
                { model: db.PSSchemes, as: 'scheme' }
            ],
            limit: 1
        });
        const permitCount = await db.SocialForestPermits.count();
        const membersCount = await db.InstitutionMembers.count();
        
        fs.writeFileSync('compare_out.json', JSON.stringify({
           db_totalPermits: permitCount,
           db_totalMembersRow: membersCount,
           sample: permits[0] ? permits[0].toJSON() : null
        }, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await db.sequelize.close();
    }
}
run();
