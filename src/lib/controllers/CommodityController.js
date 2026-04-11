const {
    PermitCommodities,
    Commodities,
    ProductionRecords,
    DerivedProducts
} = require('@/lib/db/models');

exports.getCommodityData = async (req, res) => {
    try {
        const { permitId } = req.params;

        // Main commodities linked to permit
        const permitCommodities = await PermitCommodities.findAll({
            where: { permitId },
            include: [{ model: Commodities, as: 'commodity' }]
        });

        // Production records
        const production = await ProductionRecords.findAll({
            where: { permitId },
            include: [{ model: Commodities, as: 'commodity' }],
            order: [['year', 'DESC'], ['month', 'DESC']]
        });

        // Get derived products for the commodities this permit has
        const commodityIds = permitCommodities.map(pc => pc.commodityId);
        const derivedProducts = await DerivedProducts.findAll({
            where: { commodityId: commodityIds },
            include: [{ model: Commodities, as: 'commodity' }]
        });

        res.json({
            commodities: permitCommodities,
            production,
            derivedProducts
        });
    } catch (error) {
        console.error('Error fetching commodity data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
