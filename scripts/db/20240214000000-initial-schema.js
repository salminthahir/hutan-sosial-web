'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Wilayah Administratif
        await queryInterface.createTable('Provinces', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            name: { type: Sequelize.STRING(100), allowNull: false },
            code: { type: Sequelize.STRING(10) },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('Regencies', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            provinceId: { type: Sequelize.INTEGER, references: { model: 'Provinces', key: 'id' }, onDelete: 'CASCADE' },
            name: { type: Sequelize.STRING(100), allowNull: false },
            type: { type: Sequelize.STRING(20) }, // Kota / Kabupaten
            code: { type: Sequelize.STRING(10) },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('Districts', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            regencyId: { type: Sequelize.INTEGER, references: { model: 'Regencies', key: 'id' }, onDelete: 'CASCADE' },
            name: { type: Sequelize.STRING(100), allowNull: false },
            code: { type: Sequelize.STRING(10) },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('Villages', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            districtId: { type: Sequelize.INTEGER, references: { model: 'Districts', key: 'id' }, onDelete: 'CASCADE' },
            name: { type: Sequelize.STRING(100), allowNull: false },
            code: { type: Sequelize.STRING(20) },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // 2. Lembaga
        await queryInterface.createTable('InstitutionTypes', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
            name: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('Institutions', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            institutionTypeId: { type: Sequelize.INTEGER, references: { model: 'InstitutionTypes', key: 'id' } },
            shortName: { type: Sequelize.STRING(100), allowNull: false },
            fullName: { type: Sequelize.STRING(200), allowNull: false },
            chairmanName: { type: Sequelize.STRING(150) },
            isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
            businessPlanStatus: { type: Sequelize.STRING(20) }, // KPS, KUPS
            aepStatus: { type: Sequelize.BOOLEAN, defaultValue: false },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('InstitutionContacts', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            institutionId: { type: Sequelize.INTEGER, references: { model: 'Institutions', key: 'id' }, onDelete: 'CASCADE' },
            contactType: { type: Sequelize.STRING(20) }, // phone, email, wa
            contactValue: { type: Sequelize.STRING(100) },
            isPrimary: { type: Sequelize.BOOLEAN, defaultValue: false },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('InstitutionMembers', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            institutionId: { type: Sequelize.INTEGER, references: { model: 'Institutions', key: 'id' }, onDelete: 'CASCADE' },
            totalMembers: { type: Sequelize.INTEGER },
            totalHouseholds: { type: Sequelize.INTEGER },
            yearRecorded: { type: Sequelize.INTEGER },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // 3. Izin PS
        await queryInterface.createTable('PSSchemes', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
            name: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('ForestAreaStatuses', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            code: { type: Sequelize.STRING(10), allowNull: false, unique: true },
            name: { type: Sequelize.STRING(100), allowNull: false },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('SocialForestPermits', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            institutionId: { type: Sequelize.INTEGER, references: { model: 'Institutions', key: 'id' } },
            villageId: { type: Sequelize.INTEGER, references: { model: 'Villages', key: 'id' } },
            schemeId: { type: Sequelize.INTEGER, references: { model: 'PSSchemes', key: 'id' } },

            // Geospatial
            location: { type: Sequelize.GEOMETRY('POINT', 4326) },
            boundary: { type: Sequelize.GEOMETRY('POLYGON', 4326) },

            // Legalitas
            permitNumber: { type: Sequelize.TEXT },
            permitYear: { type: Sequelize.INTEGER },
            permitStatus: { type: Sequelize.STRING(20), defaultValue: 'Izin' },
            validFrom: { type: Sequelize.DATEONLY },
            validUntil: { type: Sequelize.DATEONLY },

            // Luas
            areaPermitted: { type: Sequelize.DECIMAL(12, 2) },
            areaInProcess: { type: Sequelize.DECIMAL(12, 2) },

            // Dokumen & Konflik
            hasPhysicalDoc: { type: Sequelize.BOOLEAN, defaultValue: false },
            hasPdfDoc: { type: Sequelize.BOOLEAN, defaultValue: false },
            hasHandover: { type: Sequelize.BOOLEAN, defaultValue: false },
            hasLandConflict: { type: Sequelize.BOOLEAN, defaultValue: false },

            // Akses
            roadAccessType: { type: Sequelize.STRING(50) },
            portAccess: { type: Sequelize.BOOLEAN },
            distanceToMarket: { type: Sequelize.DECIMAL(8, 2) },

            notes: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // 4. Komoditas
        await queryInterface.createTable('Commodities', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
            category: { type: Sequelize.STRING(50) },
            iconUrl: { type: Sequelize.TEXT },
            description: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('PermitCommodities', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE' },
            commodityId: { type: Sequelize.INTEGER, references: { model: 'Commodities', key: 'id' }, onDelete: 'CASCADE' },
            isPrimary: { type: Sequelize.BOOLEAN, defaultValue: false },
            productionQty: { type: Sequelize.DECIMAL(12, 2) },
            productionUnit: { type: Sequelize.STRING(20) },
            notes: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        await queryInterface.createTable('PermitForestStatuses', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE' },
            statusId: { type: Sequelize.INTEGER, references: { model: 'ForestAreaStatuses', key: 'id' }, onDelete: 'CASCADE' },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // 5. Users
        await queryInterface.createTable('Users', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            email: { type: Sequelize.STRING(200), allowNull: false, unique: true },
            passwordHash: { type: Sequelize.TEXT, allowNull: false },
            fullName: { type: Sequelize.STRING(150) },
            role: { type: Sequelize.STRING(30), allowNull: false }, // admin, fasilitator, viewer
            phone: { type: Sequelize.STRING(20) },
            isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
            lastLoginAt: { type: Sequelize.DATE },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // Indexes
        await queryInterface.addIndex('SocialForestPermits', ['location'], { using: 'GIST' });
        await queryInterface.addIndex('SocialForestPermits', ['schemeId']);
        await queryInterface.addIndex('SocialForestPermits', ['villageId']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Users');
        await queryInterface.dropTable('PermitCommodities');
        await queryInterface.dropTable('PermitForestStatuses');
        await queryInterface.dropTable('Commodities');
        await queryInterface.dropTable('SocialForestPermits');
        await queryInterface.dropTable('ForestAreaStatuses');
        await queryInterface.dropTable('PSSchemes');
        await queryInterface.dropTable('InstitutionMembers');
        await queryInterface.dropTable('InstitutionContacts');
        await queryInterface.dropTable('Institutions');
        await queryInterface.dropTable('InstitutionTypes');
        await queryInterface.dropTable('Villages');
        await queryInterface.dropTable('Districts');
        await queryInterface.dropTable('Regencies');
        await queryInterface.dropTable('Provinces');
    }
};
