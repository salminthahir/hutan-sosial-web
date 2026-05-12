module.exports = (sequelize, DataTypes) => {
  const KUPS = sequelize.define('KUPS', {
    // Existing fields
    name: DataTypes.STRING,
    chairmanName: DataTypes.STRING,
    totalMembers: DataTypes.STRING,
    commodities: DataTypes.TEXT,        // Changed: STRING → TEXT for long commodity lists
    businessClass: DataTypes.STRING,    // Kelas KUPS: Silver, Gold, Blue, Platinum
    permitId: DataTypes.INTEGER,

    // New fields from DATA KUPS MALUKU UTARA.xlsx
    establishedYear: DataTypes.INTEGER, // Tahun Pembentukan
    skNumber: DataTypes.STRING,         // Nomor SK KUPS
    businessType: DataTypes.TEXT,       // Jenis Usaha (e.g. "Minyak Kelapa, VCO, Briket")
    cluster: DataTypes.STRING,          // Klaster (Agroforestry, Ekowisata, Madu, dll)
    phoneNumber: DataTypes.STRING,      // Nomor Kontak ketua
    goldUpgradeYear: DataTypes.INTEGER, // Tahun Peningkatan ke Gold
    address: DataTypes.TEXT             // Alamat Lengkap
  }, {
    tableName: 'KUPS'
  });

  KUPS.associate = (models) => {
    KUPS.belongsTo(models.SocialForestPermits, { foreignKey: 'permitId', as: 'permit' });
  };

  return KUPS;
};