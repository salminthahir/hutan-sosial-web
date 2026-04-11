module.exports = (sequelize, DataTypes) => {
    const Commodities = sequelize.define('Commodities', {
        name: { type: DataTypes.STRING, unique: true },
        category: DataTypes.STRING,
        iconUrl: DataTypes.TEXT,
        description: DataTypes.TEXT
    }, {
        tableName: 'Commodities'
    });

    const PermitCommodities = sequelize.define('PermitCommodities', {
        permitId: { type: DataTypes.INTEGER, unique: 'permit_commodity_unique' },
        commodityId: { type: DataTypes.INTEGER, unique: 'permit_commodity_unique' },
        isPrimary: DataTypes.BOOLEAN,
        productionQty: DataTypes.DECIMAL(12, 2),
        productionUnit: DataTypes.STRING,
        notes: DataTypes.TEXT
    }, {
        tableName: 'PermitCommodities'
    });

    Commodities.associate = (models) => {
        Commodities.belongsToMany(models.SocialForestPermits, {
            through: models.PermitCommodities,
            foreignKey: 'commodityId',
            otherKey: 'permitId',
            as: 'permits'
        });
    };

    PermitCommodities.associate = (models) => {
        PermitCommodities.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
        PermitCommodities.belongsTo(models.Commodities, { foreignKey: 'commodityId', as: 'commodity' });
    };

    return { Commodities, PermitCommodities };
};
