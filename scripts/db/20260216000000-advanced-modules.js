'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // --- MODUL 3: BIOPHYSICAL ---

        // LandCoverTypes
        await queryInterface.createTable('LandCoverTypes', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            name: { type: Sequelize.STRING(100), allowNull: false },
            description: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // PermitLandCovers
        await queryInterface.createTable('PermitLandCovers', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE' },
            landCoverTypeId: { type: Sequelize.INTEGER, references: { model: 'LandCoverTypes', key: 'id' } },
            coverPercentage: { type: Sequelize.DECIMAL(5, 2) },
            areaHectares: { type: Sequelize.DECIMAL(12, 2) },
            yearRecorded: { type: Sequelize.INTEGER },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // BiophysicalProfiles
        await queryInterface.createTable('BiophysicalProfiles', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE', unique: true },
            rainfallMm: { type: Sequelize.DECIMAL(8, 2) },
            rainfallCategory: { type: Sequelize.STRING(50) },
            elevationM: { type: Sequelize.DECIMAL(8, 2) },
            soilType: { type: Sequelize.STRING(100) },
            slopePercent: { type: Sequelize.DECIMAL(5, 2) },
            slopeCategory: { type: Sequelize.STRING(50) },
            notes: { type: Sequelize.TEXT },
            yearRecorded: { type: Sequelize.INTEGER },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // CommoditySuitabilities
        await queryInterface.createTable('CommoditySuitabilities', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE' },
            commodityId: { type: Sequelize.INTEGER, references: { model: 'Commodities', key: 'id' }, onDelete: 'CASCADE' },
            suitabilityScore: { type: Sequelize.DECIMAL(3, 2) }, // 0.00 - 1.00
            suitabilityLevel: { type: Sequelize.STRING(20) }, // Sangat Cocok, Cocok, dll
            notes: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // --- MODUL 4: DERIVED PRODUCTS ---

        // DerivedProducts
        await queryInterface.createTable('DerivedProducts', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            commodityId: { type: Sequelize.INTEGER, references: { model: 'Commodities', key: 'id' }, onDelete: 'CASCADE' },
            name: { type: Sequelize.STRING(200), allowNull: false },
            category: { type: Sequelize.STRING(100) },
            processDescription: { type: Sequelize.TEXT },
            valueAddedMultiplier: { type: Sequelize.DECIMAL(5, 2) },
            unitPrice: { type: Sequelize.DECIMAL(12, 2) },
            priceUnit: { type: Sequelize.STRING(50) },
            marketPotential: { type: Sequelize.STRING(50) },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // ProductionRecords
        await queryInterface.createTable('ProductionRecords', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE' },
            commodityId: { type: Sequelize.INTEGER, references: { model: 'Commodities', key: 'id' }, onDelete: 'CASCADE' },
            year: { type: Sequelize.INTEGER, allowNull: false },
            month: { type: Sequelize.INTEGER },
            quantityRaw: { type: Sequelize.DECIMAL(12, 2) },
            quantityProcessed: { type: Sequelize.DECIMAL(12, 2) },
            unit: { type: Sequelize.STRING(50) },
            notes: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // --- MODUL 5: SDM & SOCIAL ---

        // GroupDemographics
        await queryInterface.createTable('GroupDemographics', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            institutionId: { type: Sequelize.INTEGER, references: { model: 'Institutions', key: 'id' }, onDelete: 'CASCADE', unique: true },
            avgAge: { type: Sequelize.DECIMAL(4, 1) },
            educationLevel: { type: Sequelize.STRING(50) },
            avgFarmingExperience: { type: Sequelize.INTEGER },
            hasSmartphoneAccess: { type: Sequelize.BOOLEAN },
            hasInternetAccess: { type: Sequelize.BOOLEAN },
            smartphonePercent: { type: Sequelize.DECIMAL(5, 2) },
            yearRecorded: { type: Sequelize.INTEGER },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // BusinessReadiness
        await queryInterface.createTable('BusinessReadiness', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            institutionId: { type: Sequelize.INTEGER, references: { model: 'Institutions', key: 'id' }, onDelete: 'CASCADE', unique: true },
            hasNIB: { type: Sequelize.BOOLEAN, defaultValue: false },
            hasBankAccount: { type: Sequelize.BOOLEAN, defaultValue: false },
            hasBookkeeping: { type: Sequelize.BOOLEAN, defaultValue: false },
            hasKURAccess: { type: Sequelize.BOOLEAN, defaultValue: false },
            kurAmount: { type: Sequelize.DECIMAL(15, 2) },
            kurBank: { type: Sequelize.STRING(100) },
            readinessScore: { type: Sequelize.DECIMAL(3, 2) },
            readinessLevel: { type: Sequelize.STRING(50) },
            yearRecorded: { type: Sequelize.INTEGER },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // --- MODUL 6: MARKET & ECONOMY ---

        // Buyers
        await queryInterface.createTable('Buyers', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            name: { type: Sequelize.STRING(200), allowNull: false },
            buyerType: { type: Sequelize.STRING(50) },
            contactPerson: { type: Sequelize.STRING(200) },
            phone: { type: Sequelize.STRING(50) },
            email: { type: Sequelize.STRING(200) },
            address: { type: Sequelize.TEXT },
            location: { type: Sequelize.GEOMETRY('POINT', 4326) },
            isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // MarketData
        await queryInterface.createTable('MarketData', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            commodityId: { type: Sequelize.INTEGER, references: { model: 'Commodities', key: 'id' }, onDelete: 'CASCADE' },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' } },
            buyerId: { type: Sequelize.INTEGER, references: { model: 'Buyers', key: 'id' } },
            localPrice: { type: Sequelize.DECIMAL(12, 2) },
            nationalPrice: { type: Sequelize.DECIMAL(12, 2) },
            priceUnit: { type: Sequelize.STRING(50) },
            absorptionVolume: { type: Sequelize.DECIMAL(12, 2) },
            absorptionUnit: { type: Sequelize.STRING(50) },
            logisticCost: { type: Sequelize.DECIMAL(12, 2) },
            hasExportPotential: { type: Sequelize.BOOLEAN, defaultValue: false },
            hasRegularBuyer: { type: Sequelize.BOOLEAN, defaultValue: false },
            yearRecorded: { type: Sequelize.INTEGER },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // SupplyChainNodes
        await queryInterface.createTable('SupplyChainNodes', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            commodityId: { type: Sequelize.INTEGER, references: { model: 'Commodities', key: 'id' }, onDelete: 'CASCADE' },
            nodeType: { type: Sequelize.STRING(50) }, // Petani, Pengepul, Industri, Retail
            name: { type: Sequelize.STRING(200) },
            location: { type: Sequelize.GEOMETRY('POINT', 4326) },
            orderInChain: { type: Sequelize.INTEGER },
            marginPercent: { type: Sequelize.DECIMAL(5, 2) },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // --- MODUL 7: RISK & ENVIRONMENT ---

        // EnvironmentalRisks
        await queryInterface.createTable('EnvironmentalRisks', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE' },
            riskType: { type: Sequelize.STRING(100) }, // Longsor, Banjir, dll
            riskLevel: { type: Sequelize.STRING(20) }, // Rendah, Sedang, Tinggi
            riskScore: { type: Sequelize.DECIMAL(3, 2) },
            zone: { type: Sequelize.GEOMETRY('POLYGON', 4326) },
            description: { type: Sequelize.TEXT },
            mitigationPlan: { type: Sequelize.TEXT },
            yearAssessed: { type: Sequelize.INTEGER },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // ProtectedZones
        await queryInterface.createTable('ProtectedZones', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            name: { type: Sequelize.STRING(200) },
            zoneType: { type: Sequelize.STRING(100) },
            boundary: { type: Sequelize.GEOMETRY('POLYGON', 4326) },
            areaHectares: { type: Sequelize.DECIMAL(12, 2) },
            legalBasis: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // CarryingCapacity
        await queryInterface.createTable('CarryingCapacity', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE', unique: true },
            capacityScore: { type: Sequelize.DECIMAL(3, 2) },
            capacityLevel: { type: Sequelize.STRING(50) },
            overExploitationRisk: { type: Sequelize.BOOLEAN, defaultValue: false },
            climateVulnerability: { type: Sequelize.STRING(50) },
            assessmentDate: { type: Sequelize.DATEONLY },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // --- MODUL 8: PRIORITY ---

        // PriorityScores
        await queryInterface.createTable('PriorityScores', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE', unique: true },
            legalScore: { type: Sequelize.DECIMAL(3, 2) },
            biophysicalScore: { type: Sequelize.DECIMAL(3, 2) },
            commodityScore: { type: Sequelize.DECIMAL(3, 2) },
            sdmScore: { type: Sequelize.DECIMAL(3, 2) },
            marketScore: { type: Sequelize.DECIMAL(3, 2) },
            environmentScore: { type: Sequelize.DECIMAL(3, 2) },
            compositeScore: { type: Sequelize.DECIMAL(3, 2) },
            priorityCategory: { type: Sequelize.STRING(50) }, // SIAP INDUSTRI, SIAP DIBINA, PERLU PEMULIHAN
            lastCalculated: { type: Sequelize.DATE },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // MonitoringLogs
        await queryInterface.createTable('MonitoringLogs', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            permitId: { type: Sequelize.INTEGER, references: { model: 'SocialForestPermits', key: 'id' }, onDelete: 'CASCADE' },
            monitorType: { type: Sequelize.STRING(100) },
            monitorDate: { type: Sequelize.DATEONLY },
            findings: { type: Sequelize.TEXT },
            recommendations: { type: Sequelize.TEXT },
            officerName: { type: Sequelize.STRING(200) },
            photos: { type: Sequelize.JSONB }, // Array of URLs
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // SystemConfig
        await queryInterface.createTable('SystemConfig', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            key: { type: Sequelize.STRING(100), allowNull: false, unique: true },
            value: { type: Sequelize.JSONB },
            description: { type: Sequelize.TEXT },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
        });

        // Add indexes
        await queryInterface.addIndex('CommoditySuitabilities', ['permitId', 'commodityId'], { unique: true });
        await queryInterface.addIndex('PriorityScores', ['compositeScore']);
        await queryInterface.addIndex('PriorityScores', ['priorityCategory']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('SystemConfig');
        await queryInterface.dropTable('MonitoringLogs');
        await queryInterface.dropTable('PriorityScores');
        await queryInterface.dropTable('CarryingCapacity');
        await queryInterface.dropTable('ProtectedZones');
        await queryInterface.dropTable('EnvironmentalRisks');
        await queryInterface.dropTable('SupplyChainNodes');
        await queryInterface.dropTable('MarketData');
        await queryInterface.dropTable('Buyers');
        await queryInterface.dropTable('BusinessReadiness');
        await queryInterface.dropTable('GroupDemographics');
        await queryInterface.dropTable('ProductionRecords');
        await queryInterface.dropTable('DerivedProducts');
        await queryInterface.dropTable('CommoditySuitabilities');
        await queryInterface.dropTable('BiophysicalProfiles');
        await queryInterface.dropTable('PermitLandCovers');
        await queryInterface.dropTable('LandCoverTypes');
    }
};
