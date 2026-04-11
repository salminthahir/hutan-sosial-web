const {
    SocialForestPermits,
    PriorityScores,
    MonitoringLogs,
    Institutions,
    Villages,
    Districts,
    Regencies,
    Sequelize
} = require('@/lib/db/models');
const { Op } = require('sequelize');

exports.getPriorityMap = async (req, res) => {
    try {
        const permits = await SocialForestPermits.findAll({
            attributes: ['id', 'location', 'permitNumber'],
            include: [
                {
                    model: PriorityScores,
                    as: 'priorityScore',
                    attributes: ['compositeScore', 'priorityCategory']
                },
                {
                    model: Institutions,
                    as: 'institution',
                    attributes: ['shortName']
                }
            ],
            where: {
                location: { [Op.not]: null }
            }
        });

        const features = permits.map(p => {
            const score = p.priorityScore ? parseFloat(p.priorityScore.compositeScore) : 0;
            const category = p.priorityScore ? p.priorityScore.priorityCategory : 'BELUM DINILAI';

            let color = '#9E9E9E'; // Grey
            if (category === 'SIAP INDUSTRI') color = '#4CAF50'; // Green
            if (category === 'SIAP DIBINA') color = '#FFC107'; // Amber
            if (category === 'PERLU PEMULIHAN') color = '#F44336'; // Red

            return {
                type: 'Feature',
                geometry: p.location,
                properties: {
                    id: p.id,
                    permitNumber: p.permitNumber,
                    institution: p.institution ? p.institution.shortName : 'N/A',
                    score: score.toFixed(2),
                    category: category,
                    color: color
                }
            };
        });

        res.json({
            type: 'FeatureCollection',
            features
        });
    } catch (error) {
        console.error('Error fetching priority map:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

exports.getPriorityDetail = async (req, res) => {
    try {
        const { permitId } = req.params;
        const score = await PriorityScores.findOne({
            where: { permitId },
            include: [
                {
                    model: SocialForestPermits,
                    as: 'permit',
                    attributes: ['permitNumber', 'permitYear', 'areaPermitted'],
                    include: [
                        { model: Institutions, as: 'institution', attributes: ['fullName'] },
                        {
                            model: Villages,
                            as: 'village',
                            include: [{
                                model: Districts,
                                as: 'district',
                                include: [{ model: Regencies, as: 'regency' }]
                            }]
                        }
                    ]
                }
            ]
        });

        if (!score) {
            return res.status(404).json({ error: 'Priority score not found for this permit' });
        }

        res.json(score);
    } catch (error) {
        console.error('Error fetching priority detail:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getMonitoringLogs = async (req, res) => {
    try {
        const { permitId } = req.params;
        const logs = await MonitoringLogs.findAll({
            where: { permitId },
            order: [['monitorDate', 'DESC']]
        });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching monitoring logs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
