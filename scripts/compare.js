require('dotenv').config({ path: '.env.local' });
const db = require('../src/lib/db/models');

async function run() {
    try {
        await db.sequelize.authenticate();
        console.log('DB connected.');

        // Get total permits in database
        const permitCount = await db.SocialForestPermits.count();
        console.log(`Total permits in Database: ${permitCount}`);

        if (permitCount > 0) {
            const samplePermit = await db.SocialForestPermits.findOne({
                include: [
                    { model: db.Institutions, as: 'institution', include: [{ model: db.InstitutionMembers, as: 'members' }] },
                    { model: db.PSSchemes, as: 'scheme' }
                ]
            });
            console.log('Sample Permit from DB (SK & Demografi):');
            console.log(JSON.stringify(samplePermit.toJSON(), null, 2));
        }

        // Get total members rows
        const membersCount = await db.InstitutionMembers.count();
        console.log(`Total InstitutionMembers rows in DB: ${membersCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        await db.sequelize.close();
    }
}
run();
