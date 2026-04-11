const {
    MarketData,
    Buyers,
    Commodities
} = require('@/lib/db/models');

exports.getMarketData = async (req, res) => {
    try {
        const { permitId } = req.params;

        const marketData = await MarketData.findAll({
            where: { permitId },
            include: [
                { model: Commodities, as: 'commodity' },
                { model: Buyers, as: 'buyer' }
            ]
        });

        res.json({
            marketData
        });
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
