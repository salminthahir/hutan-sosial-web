'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add regencyId column to AdminUsers
        await queryInterface.addColumn('AdminUsers', 'regencyId', {
            type: Sequelize.INTEGER,
            allowNull: true, // null = superadmin (akses semua)
            references: {
                model: 'Regencies',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('AdminUsers', 'regencyId');
    }
};
