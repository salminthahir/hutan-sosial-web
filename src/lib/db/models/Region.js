module.exports = (sequelize, DataTypes) => {
    const Provinces = sequelize.define('Provinces', {
        name: DataTypes.STRING,
        code: DataTypes.STRING
    }, {
        tableName: 'Provinces'
    });

    const Regencies = sequelize.define('Regencies', {
        name: DataTypes.STRING,
        code: DataTypes.STRING,
        type: DataTypes.STRING
    }, {
        tableName: 'Regencies'
    });

    const Districts = sequelize.define('Districts', {
        name: DataTypes.STRING,
        code: DataTypes.STRING
    }, {
        tableName: 'Districts'
    });

    const Villages = sequelize.define('Villages', {
        name: DataTypes.STRING,
        code: DataTypes.STRING
    }, {
        tableName: 'Villages'
    });

    Provinces.associate = (models) => {
        Provinces.hasMany(models.Regencies, { foreignKey: 'provinceId', as: 'regencies' });
    };

    Regencies.associate = (models) => {
        Regencies.belongsTo(models.Provinces, { foreignKey: 'provinceId', as: 'province' });
        Regencies.hasMany(models.Districts, { foreignKey: 'regencyId', as: 'districts' });
    };

    Districts.associate = (models) => {
        Districts.belongsTo(models.Regencies, { foreignKey: 'regencyId', as: 'regency' });
        Districts.hasMany(models.Villages, { foreignKey: 'districtId', as: 'villages' });
    };

    Villages.associate = (models) => {
        Villages.belongsTo(models.Districts, { foreignKey: 'districtId', as: 'district' });
        Villages.hasMany(models.SocialForestPermits, { foreignKey: 'villageId', as: 'permits' });
    };

    return { Provinces, Regencies, Districts, Villages };
};
