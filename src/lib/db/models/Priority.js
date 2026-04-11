module.exports = (sequelize, DataTypes) => {
    const PriorityScores = sequelize.define('PriorityScores', {
        permitId: DataTypes.INTEGER,
        legalScore: DataTypes.DECIMAL(3, 2),
        biophysicalScore: DataTypes.DECIMAL(3, 2),
        commodityScore: DataTypes.DECIMAL(3, 2),
        sdmScore: DataTypes.DECIMAL(3, 2),
        marketScore: DataTypes.DECIMAL(3, 2),
        environmentScore: DataTypes.DECIMAL(3, 2),
        compositeScore: DataTypes.DECIMAL(3, 2),
        priorityCategory: DataTypes.STRING,
        lastCalculated: DataTypes.DATE
    }, {
        tableName: 'PriorityScores'
    });

    const MonitoringLogs = sequelize.define('MonitoringLogs', {
        permitId: DataTypes.INTEGER,
        monitorType: DataTypes.STRING,
        monitorDate: DataTypes.DATEONLY,
        findings: DataTypes.TEXT,
        recommendations: DataTypes.TEXT,
        officerName: DataTypes.STRING,
        photos: DataTypes.JSONB
    }, {
        tableName: 'MonitoringLogs'
    });

    PriorityScores.associate = (models) => {
        PriorityScores.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
    };

    MonitoringLogs.associate = (models) => {
        MonitoringLogs.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
    };

    const SystemConfig = sequelize.define('SystemConfig', {
        key: DataTypes.STRING,
        value: DataTypes.JSONB,
        description: DataTypes.TEXT
    }, {
        tableName: 'SystemConfig'
    });

    return { PriorityScores, MonitoringLogs, SystemConfig };
};
