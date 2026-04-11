const {
    EnvironmentalRisks,
    CarryingCapacity
} = require('@/lib/db/models');

exports.getRiskData = async (req, res) => {
    try {
        const { permitId } = req.params;

        const risks = await EnvironmentalRisks.findAll({ where: { permitId } });
        const capacity = await CarryingCapacity.findOne({ where: { permitId } });

        res.json({
            risks,
            capacity
        });
    } catch (error) {
        console.error('Error fetching risk data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
