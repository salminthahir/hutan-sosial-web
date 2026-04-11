module.exports = (sequelize, DataTypes) => {
    const EnvironmentalRisks = sequelize.define('EnvironmentalRisks', {
        permitId: DataTypes.INTEGER,
        riskType: DataTypes.STRING,
        riskLevel: DataTypes.STRING,
        riskScore: DataTypes.DECIMAL(3, 2),
        zone: DataTypes.GEOMETRY('POLYGON', 4326),
        description: DataTypes.TEXT,
        mitigationPlan: DataTypes.TEXT,
        yearAssessed: DataTypes.INTEGER
    }, {
        tableName: 'EnvironmentalRisks'
    });

    const ProtectedZones = sequelize.define('ProtectedZones', {
        name: DataTypes.STRING,
        zoneType: DataTypes.STRING,
        boundary: DataTypes.GEOMETRY('POLYGON', 4326),
        areaHectares: DataTypes.DECIMAL(12, 2),
        legalBasis: DataTypes.TEXT
    }, {
        tableName: 'ProtectedZones'
    });

    const CarryingCapacity = sequelize.define('CarryingCapacity', {
        permitId: DataTypes.INTEGER,
        capacityScore: DataTypes.DECIMAL(3, 2),
        capacityLevel: DataTypes.STRING,
        overExploitationRisk: DataTypes.BOOLEAN,
        climateVulnerability: DataTypes.STRING,
        assessmentDate: DataTypes.DATEONLY
    }, {
        tableName: 'CarryingCapacity'
    });

    EnvironmentalRisks.associate = (models) => {
        EnvironmentalRisks.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
    };

    CarryingCapacity.associate = (models) => {
        CarryingCapacity.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
    };

    return { EnvironmentalRisks, ProtectedZones, CarryingCapacity };
};
