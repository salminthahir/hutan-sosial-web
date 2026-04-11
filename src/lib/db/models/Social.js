module.exports = (sequelize, DataTypes) => {
    const GroupDemographics = sequelize.define('GroupDemographics', {
        institutionId: DataTypes.INTEGER,
        avgAge: DataTypes.DECIMAL(4, 1),
        educationLevel: DataTypes.STRING,
        avgFarmingExperience: DataTypes.INTEGER,
        hasSmartphoneAccess: DataTypes.BOOLEAN,
        hasInternetAccess: DataTypes.BOOLEAN,
        smartphonePercent: DataTypes.DECIMAL(5, 2),
        yearRecorded: DataTypes.INTEGER
    }, {
        tableName: 'GroupDemographics'
    });

    const BusinessReadiness = sequelize.define('BusinessReadiness', {
        institutionId: DataTypes.INTEGER,
        hasNIB: DataTypes.BOOLEAN,
        hasBankAccount: DataTypes.BOOLEAN,
        hasBookkeeping: DataTypes.BOOLEAN,
        hasKURAccess: DataTypes.BOOLEAN,
        kurAmount: DataTypes.DECIMAL(15, 2),
        kurBank: DataTypes.STRING,
        readinessScore: DataTypes.DECIMAL(3, 2),
        readinessLevel: DataTypes.STRING,
        yearRecorded: DataTypes.INTEGER
    }, {
        tableName: 'BusinessReadiness'
    });

    GroupDemographics.associate = (models) => {
        GroupDemographics.belongsTo(models.Institutions, { foreignKey: 'institutionId', as: 'institution' });
    };

    BusinessReadiness.associate = (models) => {
        BusinessReadiness.belongsTo(models.Institutions, { foreignKey: 'institutionId', as: 'institution' });
    };

    return { GroupDemographics, BusinessReadiness };
};
