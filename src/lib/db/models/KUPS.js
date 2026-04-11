module.exports = (sequelize, DataTypes) => {
  const KUPS = sequelize.define('KUPS', {
    name: DataTypes.STRING,
    chairmanName: DataTypes.STRING,
    totalMembers: DataTypes.STRING,
    commodities: DataTypes.STRING,
    businessClass: DataTypes.STRING,
    permitId: DataTypes.INTEGER
  }, {
    tableName: 'KUPS'
  });

  KUPS.associate = (models) => {
    KUPS.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
  };

  return KUPS;
};