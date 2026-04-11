module.exports = (sequelize, DataTypes) => {
    const DerivedProducts = sequelize.define('DerivedProducts', {
        commodityId: DataTypes.INTEGER,
        name: DataTypes.STRING,
        category: DataTypes.STRING,
        processDescription: DataTypes.TEXT,
        valueAddedMultiplier: DataTypes.DECIMAL(5, 2),
        unitPrice: DataTypes.DECIMAL(12, 2),
        priceUnit: DataTypes.STRING,
        marketPotential: DataTypes.STRING
    }, {
        tableName: 'DerivedProducts'
    });

    const ProductionRecords = sequelize.define('ProductionRecords', {
        permitId: DataTypes.INTEGER,
        commodityId: DataTypes.INTEGER,
        year: DataTypes.INTEGER,
        month: DataTypes.INTEGER,
        quantityRaw: DataTypes.DECIMAL(12, 2),
        quantityProcessed: DataTypes.DECIMAL(12, 2),
        unit: DataTypes.STRING,
        notes: DataTypes.TEXT
    }, {
        tableName: 'ProductionRecords'
    });

    DerivedProducts.associate = (models) => {
        DerivedProducts.belongsTo(models.Commodities, { foreignKey: 'commodityId', as: 'commodity' });
    };

    ProductionRecords.associate = (models) => {
        ProductionRecords.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
        ProductionRecords.belongsTo(models.Commodities, { foreignKey: 'commodityId', as: 'commodity' });
    };

    return { DerivedProducts, ProductionRecords };
};
