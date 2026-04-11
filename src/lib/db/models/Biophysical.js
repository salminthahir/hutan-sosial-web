module.exports = (sequelize, DataTypes) => {
    const LandCoverTypes = sequelize.define('LandCoverTypes', {
        code: DataTypes.STRING,
        name: DataTypes.STRING,
        description: DataTypes.TEXT
    }, {
        tableName: 'LandCoverTypes'
    });

    const PermitLandCovers = sequelize.define('PermitLandCovers', {
        permitId: DataTypes.INTEGER,
        landCoverTypeId: DataTypes.INTEGER,
        coverPercentage: DataTypes.DECIMAL(5, 2),
        areaHectares: DataTypes.DECIMAL(12, 2),
        yearRecorded: DataTypes.INTEGER
    }, {
        tableName: 'PermitLandCovers'
    });

    const BiophysicalProfiles = sequelize.define('BiophysicalProfiles', {
        permitId: DataTypes.INTEGER,
        rainfallMm: DataTypes.DECIMAL(8, 2),
        rainfallCategory: DataTypes.STRING,
        elevationM: DataTypes.DECIMAL(8, 2),
        soilType: DataTypes.STRING,
        slopePercent: DataTypes.DECIMAL(5, 2),
        slopeCategory: DataTypes.STRING,
        notes: DataTypes.TEXT,
        yearRecorded: DataTypes.INTEGER
    }, {
        tableName: 'BiophysicalProfiles'
    });

    const CommoditySuitabilities = sequelize.define('CommoditySuitabilities', {
        permitId: DataTypes.INTEGER,
        commodityId: DataTypes.INTEGER,
        suitabilityScore: DataTypes.DECIMAL(3, 2),
        suitabilityLevel: DataTypes.STRING,
        notes: DataTypes.TEXT
    }, {
        tableName: 'CommoditySuitabilities'
    });

    LandCoverTypes.associate = (models) => {
        LandCoverTypes.hasMany(models.PermitLandCovers, { foreignKey: 'landCoverTypeId', as: 'permits' });
    };

    PermitLandCovers.associate = (models) => {
        PermitLandCovers.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
        PermitLandCovers.belongsTo(models.LandCoverTypes, { foreignKey: 'landCoverTypeId', as: 'type' });
    };

    BiophysicalProfiles.associate = (models) => {
        BiophysicalProfiles.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
    };

    CommoditySuitabilities.associate = (models) => {
        CommoditySuitabilities.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
        CommoditySuitabilities.belongsTo(models.Commodities, { foreignKey: 'commodityId', as: 'commodity' });
    };

    return { LandCoverTypes, PermitLandCovers, BiophysicalProfiles, CommoditySuitabilities };
};
