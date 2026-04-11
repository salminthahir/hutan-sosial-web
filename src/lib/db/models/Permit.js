module.exports = (sequelize, DataTypes) => {
    const PSSchemes = sequelize.define('PSSchemes', {
        code: { type: DataTypes.STRING, unique: true },
        name: DataTypes.STRING,
        description: DataTypes.TEXT
    }, {
        tableName: 'PSSchemes'
    });

    const ForestAreaStatuses = sequelize.define('ForestAreaStatuses', {
        code: { type: DataTypes.STRING, unique: true },
        name: DataTypes.STRING
    }, {
        tableName: 'ForestAreaStatuses'
    });

    const PermitForestStatuses = sequelize.define('PermitForestStatuses', {
        permitId: { type: DataTypes.INTEGER, unique: 'permit_status_unique' },
        statusId: { type: DataTypes.INTEGER, unique: 'permit_status_unique' }
    }, {
        tableName: 'PermitForestStatuses'
    });

    const SocialForestPermits = sequelize.define('SocialForestPermits', {
        institutionId: DataTypes.INTEGER,
        villageId: DataTypes.INTEGER,
        schemeId: DataTypes.INTEGER,
        location: DataTypes.GEOMETRY('POINT', 4326),
        boundary: DataTypes.GEOMETRY('GEOMETRY', 4326),
        permitNumber: DataTypes.TEXT,
        permitYear: DataTypes.INTEGER,
        permitStatus: DataTypes.STRING,
        validFrom: DataTypes.DATEONLY,
        validUntil: DataTypes.DATEONLY,
        areaPermitted: DataTypes.DECIMAL(12, 2),
        areaInProcess: DataTypes.DECIMAL(12, 2),
        hasPhysicalDoc: DataTypes.BOOLEAN,
        hasPdfDoc: DataTypes.BOOLEAN,
        pdfUrl: DataTypes.STRING,
        hasHandover: DataTypes.BOOLEAN,
        hasLandConflict: DataTypes.BOOLEAN,
        roadAccessType: DataTypes.STRING,
        portAccess: DataTypes.BOOLEAN,
        distanceToMarket: DataTypes.DECIMAL(8, 2),
        notes: DataTypes.TEXT
    }, {
        tableName: 'SocialForestPermits'
    });

    PSSchemes.associate = (models) => {
        PSSchemes.hasMany(models.SocialForestPermits, { foreignKey: 'schemeId', as: 'permits' });
    };

    SocialForestPermits.associate = (models) => {
        SocialForestPermits.belongsTo(models.PSSchemes, { foreignKey: 'schemeId', as: 'scheme' });
        SocialForestPermits.belongsTo(models.Institutions, { foreignKey: 'institutionId', as: 'institution' });
        SocialForestPermits.belongsTo(models.Villages, { foreignKey: 'villageId', as: 'village' });
        SocialForestPermits.hasMany(models.KUPS, { foreignKey: 'permitId', as: 'kups' });

        // M:N with ForestAreaStatuses
        SocialForestPermits.belongsToMany(models.ForestAreaStatuses, {
            through: models.PermitForestStatuses,
            foreignKey: 'permitId',
            otherKey: 'statusId',
            as: 'forestStatuses'
        });
        // Also hasMany PermitForestStatuses for manual include
        SocialForestPermits.hasMany(models.PermitForestStatuses, { foreignKey: 'permitId', as: 'permitForestStatuses' });

        // M:N with Commodities
        SocialForestPermits.belongsToMany(models.Commodities, {
            through: models.PermitCommodities,
            foreignKey: 'permitId',
            otherKey: 'commodityId',
            as: 'commodities'
        });
        // Also hasMany PermitCommodities for manual include
        SocialForestPermits.hasMany(models.PermitCommodities, { foreignKey: 'permitId', as: 'permitCommodities' });

        // Advanced Modules Associations
        if (models.PriorityScores) {
            SocialForestPermits.hasOne(models.PriorityScores, { foreignKey: 'permitId', as: 'priorityScore' });
        }
        if (models.MonitoringLogs) {
            SocialForestPermits.hasMany(models.MonitoringLogs, { foreignKey: 'permitId', as: 'monitoringLogs' });
        }
        if (models.BiophysicalProfiles) {
            SocialForestPermits.hasOne(models.BiophysicalProfiles, { foreignKey: 'permitId', as: 'biophysicalProfile' });
        }
        if (models.CommoditySuitabilities) {
            SocialForestPermits.hasMany(models.CommoditySuitabilities, { foreignKey: 'permitId', as: 'commoditySuitabilities' });
        }
    };

    ForestAreaStatuses.associate = (models) => {
        ForestAreaStatuses.belongsToMany(models.SocialForestPermits, {
            through: models.PermitForestStatuses,
            foreignKey: 'statusId',
            otherKey: 'permitId',
            as: 'permits'
        });
    };

    PermitForestStatuses.associate = (models) => {
        PermitForestStatuses.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
        PermitForestStatuses.belongsTo(models.ForestAreaStatuses, { foreignKey: 'statusId', as: 'status' });
    };

    return { PSSchemes, ForestAreaStatuses, SocialForestPermits, PermitForestStatuses };
};
