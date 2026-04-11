module.exports = (sequelize, DataTypes) => {
    const InstitutionTypes = sequelize.define('InstitutionTypes', {
        code: { type: DataTypes.STRING, unique: true },
        name: DataTypes.STRING,
        description: DataTypes.TEXT
    }, {
        tableName: 'InstitutionTypes'
    });

    const Institutions = sequelize.define('Institutions', {
        institutionTypeId: DataTypes.INTEGER,
        shortName: DataTypes.STRING,
        fullName: DataTypes.STRING,
        chairmanName: DataTypes.STRING,
        isActive: DataTypes.BOOLEAN,
        businessPlanStatus: DataTypes.STRING,
        aepStatus: DataTypes.BOOLEAN
    }, {
        tableName: 'Institutions'
    });

    const InstitutionContacts = sequelize.define('InstitutionContacts', {
        institutionId: DataTypes.INTEGER,
        contactType: DataTypes.STRING,
        contactValue: DataTypes.STRING,
        isPrimary: DataTypes.BOOLEAN
    }, {
        tableName: 'InstitutionContacts'
    });

    const InstitutionMembers = sequelize.define('InstitutionMembers', {
        institutionId: DataTypes.INTEGER,
        totalMembers: DataTypes.INTEGER,
        totalHouseholds: DataTypes.INTEGER,
        yearRecorded: DataTypes.INTEGER
    }, {
        tableName: 'InstitutionMembers'
    });

    InstitutionTypes.associate = (models) => {
        InstitutionTypes.hasMany(models.Institutions, { foreignKey: 'institutionTypeId', as: 'institutions' });
    };

    Institutions.associate = (models) => {
        Institutions.belongsTo(models.InstitutionTypes, { foreignKey: 'institutionTypeId', as: 'type' });
        Institutions.hasMany(models.InstitutionContacts, { foreignKey: 'institutionId', as: 'contacts' });
        Institutions.hasMany(models.InstitutionMembers, { foreignKey: 'institutionId', as: 'members' });
        Institutions.hasMany(models.SocialForestPermits, { foreignKey: 'institutionId', as: 'permits' });
    };

    InstitutionContacts.associate = (models) => {
        InstitutionContacts.belongsTo(models.Institutions, { foreignKey: 'institutionId', as: 'institution' });
    };

    InstitutionMembers.associate = (models) => {
        InstitutionMembers.belongsTo(models.Institutions, { foreignKey: 'institutionId', as: 'institution' });
    };

    return { InstitutionTypes, Institutions, InstitutionContacts, InstitutionMembers };
};
