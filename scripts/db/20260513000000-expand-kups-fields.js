'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns to KUPS table for full Excel data support
    await queryInterface.addColumn('KUPS', 'establishedYear', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Tahun Pembentukan KUPS'
    });

    await queryInterface.addColumn('KUPS', 'skNumber', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Nomor SK KUPS'
    });

    await queryInterface.addColumn('KUPS', 'businessType', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Jenis Usaha detail'
    });

    await queryInterface.addColumn('KUPS', 'cluster', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Klaster usaha (Agroforestry, Ekowisata, Madu, dll)'
    });

    await queryInterface.addColumn('KUPS', 'phoneNumber', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Nomor kontak ketua KUPS'
    });

    await queryInterface.addColumn('KUPS', 'goldUpgradeYear', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Tahun peningkatan ke kelas Gold'
    });

    await queryInterface.addColumn('KUPS', 'address', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Alamat lengkap KUPS'
    });

    // Also change commodities from STRING(255) to TEXT to accommodate long commodity lists
    await queryInterface.changeColumn('KUPS', 'commodities', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('KUPS', 'establishedYear');
    await queryInterface.removeColumn('KUPS', 'skNumber');
    await queryInterface.removeColumn('KUPS', 'businessType');
    await queryInterface.removeColumn('KUPS', 'cluster');
    await queryInterface.removeColumn('KUPS', 'phoneNumber');
    await queryInterface.removeColumn('KUPS', 'goldUpgradeYear');
    await queryInterface.removeColumn('KUPS', 'address');
    await queryInterface.changeColumn('KUPS', 'commodities', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
