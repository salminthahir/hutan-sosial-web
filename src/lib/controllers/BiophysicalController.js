const {
    BiophysicalProfiles,
    PermitLandCovers,
    LandCoverTypes,
    CommoditySuitabilities,
    Commodities
} = require('@/lib/db/models');

exports.getBiophysicalData = async (req, res) => {
    try {
        const { permitId } = req.params;

        const profile = await BiophysicalProfiles.findOne({ where: { permitId } });

        const landCovers = await PermitLandCovers.findAll({
            where: { permitId },
            include: [{ model: LandCoverTypes, as: 'type' }]
        });

        const suitabilities = await CommoditySuitabilities.findAll({
            where: { permitId },
            include: [{ model: Commodities, as: 'commodity' }]
        });

        res.json({
            profile,
            landCovers,
            suitabilities
        });
    } catch (error) {
        console.error('Error fetching biophysical data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getBiophysicalMap = async (req, res) => {
    try {
        const { commodityId } = req.query;
        const { SocialForestPermits, BiophysicalProfiles, CommoditySuitabilities, Institutions } = require('@/lib/db/models');
        const { Op } = require('sequelize');

        const includeArr = [
            {
                model: Institutions,
                as: 'institution',
                attributes: ['shortName']
            },
            {
                model: BiophysicalProfiles,
                as: 'biophysicalProfile',
                attributes: ['elevationM', 'rainfallCategory', 'soilType']
            }
        ];

        if (commodityId) {
            includeArr.push({
                model: CommoditySuitabilities,
                as: 'commoditySuitabilities',
                where: { commodityId },
                required: false // LEFT JOIN so we still get features that might not have suitability scores
            });
        }

        const permits = await SocialForestPermits.findAll({
            attributes: ['id', 'location', 'permitNumber'],
            include: includeArr,
            where: {
                location: { [Op.not]: null }
            }
        });

        const features = permits.map(p => {
            const bio = p.biophysicalProfile;
            let score = 0;
            let level = 'Belum Dinilai';
            let color = '#9E9E9E'; // Grey (default if no commodity selected or lack of data)

            if (commodityId && p.commoditySuitabilities && p.commoditySuitabilities.length > 0) {
                const suit = p.commoditySuitabilities[0];
                score = suit.suitabilityScore ? parseFloat(suit.suitabilityScore) : 0;
                level = suit.suitabilityLevel || 'Belum Dinilai';

                if (level.includes('Sangat Sesuai') || level === 'S1') color = '#4CAF50'; // Green
                else if (level.includes('Cukup Sesuai') || level === 'S2') color = '#8BC34A'; // Light Green
                else if (level.includes('Sesuai Marginal') || level === 'S3') color = '#FFC107'; // Amber
                else if (level.includes('Tidak Sesuai') || level === 'N') color = '#F44336'; // Red
            }

            return {
                type: 'Feature',
                geometry: p.location,
                properties: {
                    id: p.id,
                    permitNumber: p.permitNumber,
                    institution: p.institution ? p.institution.shortName : 'N/A',
                    suitabilityScore: score.toFixed(2),
                    suitabilityLevel: level,
                    elevationM: bio ? bio.elevationM : null,
                    rainfallCategory: bio ? bio.rainfallCategory : 'N/A',
                    soilType: bio ? bio.soilType : 'N/A',
                    color: color
                }
            };
        });

        res.json({
            type: 'FeatureCollection',
            features
        });
    } catch (error) {
        console.error('Error fetching biophysical map:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};
