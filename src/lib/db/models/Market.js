module.exports = (sequelize, DataTypes) => {
    const Buyers = sequelize.define('Buyers', {
        name: DataTypes.STRING,
        buyerType: DataTypes.STRING,
        contactPerson: DataTypes.STRING,
        phone: DataTypes.STRING,
        email: DataTypes.STRING,
        address: DataTypes.TEXT,
        location: DataTypes.GEOMETRY('POINT', 4326),
        isActive: DataTypes.BOOLEAN
    }, {
        tableName: 'Buyers'
    });

    const MarketData = sequelize.define('MarketData', {
        commodityId: DataTypes.INTEGER,
        permitId: DataTypes.INTEGER,
        buyerId: DataTypes.INTEGER,
        localPrice: DataTypes.DECIMAL(12, 2),
        nationalPrice: DataTypes.DECIMAL(12, 2),
        priceUnit: DataTypes.STRING,
        absorptionVolume: DataTypes.DECIMAL(12, 2),
        absorptionUnit: DataTypes.STRING,
        logisticCost: DataTypes.DECIMAL(12, 2),
        hasExportPotential: DataTypes.BOOLEAN,
        hasRegularBuyer: DataTypes.BOOLEAN,
        yearRecorded: DataTypes.INTEGER
    }, {
        tableName: 'MarketData'
    });

    const SupplyChainNodes = sequelize.define('SupplyChainNodes', {
        commodityId: DataTypes.INTEGER,
        nodeType: DataTypes.STRING,
        name: DataTypes.STRING,
        location: DataTypes.GEOMETRY('POINT', 4326),
        orderInChain: DataTypes.INTEGER,
        marginPercent: DataTypes.DECIMAL(5, 2)
    }, {
        tableName: 'SupplyChainNodes'
    });

    Buyers.associate = (models) => {
        Buyers.hasMany(models.MarketData, { foreignKey: 'buyerId', as: 'marketData' });
    };

    MarketData.associate = (models) => {
        MarketData.belongsTo(models.Commodities, { foreignKey: 'commodityId', as: 'commodity' });
        MarketData.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
        MarketData.belongsTo(models.Buyers, { foreignKey: 'buyerId', as: 'buyer' });
    };

    SupplyChainNodes.associate = (models) => {
        SupplyChainNodes.belongsTo(models.Commodities, { foreignKey: 'commodityId', as: 'commodity' });
    };

    return { Buyers, MarketData, SupplyChainNodes };
};
