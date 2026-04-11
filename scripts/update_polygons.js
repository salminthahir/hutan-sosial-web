const { SocialForestPermits } = require('../models');
const Sequelize = require('sequelize');

async function updatePolygons() {
    try {
        console.log('Fetching permits...');
        const permits = await SocialForestPermits.findAll({
            where: {
                location: { [Sequelize.Op.not]: null }
            },
            limit: 10 // Update top 10 for testing
        });

        console.log(`Found ${permits.length} permits to update with dummy polygons.`);

        for (const permit of permits) {
            const point = permit.location; // GeoJSON Point { type: 'Point', coordinates: [lon, lat] }
            if (point && point.coordinates) {
                const [lon, lat] = point.coordinates;
                // Create a small square around the point (~0.01 degree)
                const offset = 0.01;
                const polygon = {
                    type: 'Polygon',
                    coordinates: [[
                        [lon - offset, lat - offset],
                        [lon + offset, lat - offset],
                        [lon + offset, lat + offset],
                        [lon - offset, lat + offset],
                        [lon - offset, lat - offset]
                    ]]
                };

                await permit.update({ boundary: polygon });
                console.log(`Updated permit ${permit.id} with polygon.`);
            }
        }

        console.log('Update complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating polygons:', error);
        process.exit(1);
    }
}

updatePolygons();
