'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('SocialForestPermits', 'pdfUrl', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Link or path to download the PDF SK document'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('SocialForestPermits', 'pdfUrl');
    }
};
