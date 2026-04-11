'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('KUPS', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      chairmanName: {
        type: Sequelize.STRING
      },
      totalMembers: {
        type: Sequelize.STRING
      },
      commodities: {
        type: Sequelize.STRING
      },
      businessClass: {
        type: Sequelize.STRING
      },
      permitId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'SocialForestPermits',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Kups');
  }
};