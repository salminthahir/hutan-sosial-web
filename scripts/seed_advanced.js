const {
    sequelize,
    SocialForestPermits,
    Institutions,
    Commodities,
    LandCoverTypes,
    PermitLandCovers,
    BiophysicalProfiles,
    CommoditySuitabilities,
    DerivedProducts,
    ProductionRecords,
    GroupDemographics,
    BusinessReadiness,
    Buyers,
    MarketData,
    SupplyChainNodes,
    EnvironmentalRisks,
    ProtectedZones,
    CarryingCapacity,
    PriorityScores,
    SystemConfig
} = require('../models');

const { Op } = require('sequelize');

async function seedAdvanced() {
    try {
        console.log('🌱 Starting Advanced Modules Seeding...');

        // 1. System Config (Scoring Weights)
        await SystemConfig.findOrCreate({
            where: { key: 'scoring_weights' },
            defaults: {
                value: {
                    legal: 0.15,
                    biophysical: 0.15,
                    commodity: 0.15,
                    sdm: 0.15,
                    market: 0.15,
                    environment: 0.15,
                    composite: 1.0
                },
                description: 'Bobot penilaian untuk setiap aspek'
            }
        });

        // 2. Land Cover Types
        const landCovers = [
            { code: 'HK1', name: 'Hutan Lahan Kering Primer' },
            { code: 'HK2', name: 'Hutan Lahan Kering Sekunder' },
            { code: 'PL', name: 'Pertanian Lahan Kering' },
            { code: 'SB', name: 'Semak Belukar' },
            { code: 'KB', name: 'Perkebunan' },
        ];

        const landCoverMap = {};
        for (const lc of landCovers) {
            const [record] = await LandCoverTypes.findOrCreate({
                where: { code: lc.code },
                defaults: lc
            });
            landCoverMap[lc.code] = record.id;
        }

        // 3. Derived Products (for existing commodities)
        const commodities = await Commodities.findAll();
        const derivedProductsData = {
            'Kelapa': [
                { name: 'Minyak Goreng Kelapa', category: 'Olahan Pangan', valueAdded: 2.5, price: 15000, unit: 'Liter' },
                { name: 'VCO', category: 'Kesehatan', valueAdded: 5.0, price: 50000, unit: 'Botol 250ml' },
                { name: 'Gula Merah', category: 'Olahan Pangan', valueAdded: 1.5, price: 12000, unit: 'Kg' }
            ],
            'Pala': [
                { name: 'Minyak Atsiri Pala', category: 'Minyak Atsiri', valueAdded: 8.0, price: 1500000, unit: 'Liter' },
                { name: 'Manisan Pala', category: 'Makanan Ringan', valueAdded: 2.0, price: 30000, unit: 'Bungkus' },
                { name: 'Sirup Pala', category: 'Minuman', valueAdded: 2.5, price: 25000, unit: 'Botol' }
            ],
            'Cengkeh': [
                { name: 'Minyak Cengkeh', category: 'Minyak Atsiri', valueAdded: 6.0, price: 800000, unit: 'Liter' },
                { name: 'Rokok Kretek (Bahan Baku)', category: 'Industri', valueAdded: 1.2, price: 120000, unit: 'Kg' }
            ],
            'Kopi': [
                { name: 'Kopi Bubuk Premium', category: 'Minuman', valueAdded: 3.0, price: 80000, unit: 'Kg' },
                { name: 'Kopi Green Bean', category: 'Bahan Baku', valueAdded: 1.5, price: 40000, unit: 'Kg' }
            ],
            'Kakao': [
                { name: 'Bubuk Coklat', category: 'Makanan', valueAdded: 3.5, price: 65000, unit: 'Kg' },
                { name: 'Lemak Kakao', category: 'Industri Kosmetik', valueAdded: 5.0, price: 150000, unit: 'Kg' }
            ]
        };

        for (const comm of commodities) {
            // Find key match loosely
            const key = Object.keys(derivedProductsData).find(k => comm.name.includes(k));
            if (key) {
                for (const prod of derivedProductsData[key]) {
                    await DerivedProducts.findOrCreate({
                        where: { name: prod.name, commodityId: comm.id },
                        defaults: {
                            category: prod.category,
                            valueAddedMultiplier: prod.valueAdded,
                            unitPrice: prod.price,
                            priceUnit: prod.unit,
                            marketPotential: 'Tinggi'
                        }
                    });
                }
            }
        }

        // 4. Buyers
        const buyers = [
            { name: 'PT. Indofood Sukses Makmur', type: 'Industri Besar', contact: 'Budi Santoso', phone: '021-1234567', location: { type: 'Point', coordinates: [127.38, 0.8] } },
            { name: 'UD. Hasil Bumi Malut', type: 'Pengepul Besar', contact: 'Haji Ahmad', phone: '0812-3456-7890', location: { type: 'Point', coordinates: [127.5, 0.7] } },
            { name: 'Koperasi Unit Desa Sejahtera', type: 'Koperasi', contact: 'Siti Aminah', phone: '0813-9876-5432', location: { type: 'Point', coordinates: [127.4, 0.9] } },
            { name: 'CV. Aroma Rempah Nusantara', type: 'Eksportir', contact: 'Robert Tanaka', phone: '0811-2233-4455', location: { type: 'Point', coordinates: [127.35, 0.85] } },
            { name: 'Pasar Lokal Ternate', type: 'Retail', contact: 'Koordinator Pasar', phone: '-', location: { type: 'Point', coordinates: [127.38, 0.79] } }
        ];

        const buyerIds = [];
        for (const b of buyers) {
            const [buyer] = await Buyers.findOrCreate({
                where: { name: b.name },
                defaults: { ...b }
            });
            buyerIds.push(buyer.id);
        }

        // 5. Loop through existing Permits to generate per-permit dummy data
        const permits = await SocialForestPermits.findAll({ limit: 50 }); // Limit to 50 for quick seed
        console.log(`Creating advanced data for ${permits.length} permits...`);

        for (const permit of permits) {
            const pid = permit.id;
            const instId = permit.institutionId;

            // --- Module 3: Biophysical ---
            // Profile
            await BiophysicalProfiles.upsert({
                permitId: pid,
                rainfallMm: 2000 + Math.random() * 1000,
                rainfallCategory: 'Tinggi',
                elevationM: 100 + Math.random() * 800,
                soilType: ['Latosol', 'Podsolik', 'Aluvial', 'Andosol'][Math.floor(Math.random() * 4)],
                slopePercent: Math.random() * 40,
                slopeCategory: 'Agak Curam',
                yearRecorded: 2024
            });

            // Land Cover (Random mix)
            await PermitLandCovers.destroy({ where: { permitId: pid } });
            await PermitLandCovers.create({ permitId: pid, landCoverTypeId: landCoverMap['HK2'], coverPercentage: 40.0, yearRecorded: 2024 });
            await PermitLandCovers.create({ permitId: pid, landCoverTypeId: landCoverMap['KB'], coverPercentage: 30.0, yearRecorded: 2024 });
            await PermitLandCovers.create({ permitId: pid, landCoverTypeId: landCoverMap['SB'], coverPercentage: 30.0, yearRecorded: 2024 });

            // Suitability (Random for few commodities)
            const randomComm = commodities[Math.floor(Math.random() * commodities.length)];
            await CommoditySuitabilities.upsert({
                permitId: pid,
                commodityId: randomComm.id,
                suitabilityScore: 0.7 + Math.random() * 0.3, // 0.7 - 1.0
                suitabilityLevel: 'Sangat Cocok'
            });

            // --- Module 5: SDM ---
            if (instId) {
                await GroupDemographics.upsert({
                    institutionId: instId,
                    avgAge: 40 + Math.floor(Math.random() * 15),
                    educationLevel: ['SD', 'SMP', 'SMA'][Math.floor(Math.random() * 3)],
                    avgFarmingExperience: 5 + Math.floor(Math.random() * 20),
                    hasSmartphoneAccess: Math.random() > 0.3,
                    hasInternetAccess: Math.random() > 0.5,
                    smartphonePercent: Math.random() * 100,
                    yearRecorded: 2024
                });

                await BusinessReadiness.upsert({
                    institutionId: instId,
                    hasNIB: Math.random() > 0.5,
                    hasBankAccount: Math.random() > 0.4,
                    hasBookkeeping: Math.random() > 0.7, // Jarang
                    hasKURAccess: Math.random() > 0.8,
                    readinessScore: Math.random(), // 0-1
                    readinessLevel: ['Pemula', 'Berkembang', 'Maju'][Math.floor(Math.random() * 3)],
                    yearRecorded: 2024
                });
            }

            // --- Module 6: Market ---
            await MarketData.create({
                commodityId: randomComm.id,
                permitId: pid,
                buyerId: buyerIds[Math.floor(Math.random() * buyerIds.length)],
                localPrice: 10000 + Math.random() * 50000,
                nationalPrice: 15000 + Math.random() * 50000,
                priceUnit: 'Kg',
                absorptionVolume: Math.random() * 1000,
                absorptionUnit: 'Ton/Tahun',
                yearRecorded: 2024
            });

            // --- Module 7: Risk ---
            await CarryingCapacity.upsert({
                permitId: pid,
                capacityScore: Math.random(),
                capacityLevel: ['Aman', 'Waspada', 'Kritis'][Math.floor(Math.random() * 3)],
                overExploitationRisk: Math.random() > 0.8,
                assessmentDate: new Date()
            });

            if (Math.random() > 0.7) {
                await EnvironmentalRisks.create({
                    permitId: pid,
                    riskType: 'Longsor',
                    riskLevel: 'Sedang',
                    description: 'Potensi longsor di lereng curam saat musim hujan',
                    yearAssessed: 2024
                });
            }

            // --- Module 8: Priority Scores ---
            const r = () => Math.random();
            const legalScore = r();
            const bioScore = r();
            const aggScore = (legalScore + bioScore + r() + r() + r() + r()) / 6;

            let category = 'SIAP DIBINA';
            if (aggScore > 0.75) category = 'SIAP INDUSTRI';
            if (aggScore < 0.4) category = 'PERLU PEMULIHAN';

            await PriorityScores.upsert({
                permitId: pid,
                legalScore: legalScore,
                biophysicalScore: bioScore,
                commodityScore: r(),
                sdmScore: r(),
                marketScore: r(),
                environmentScore: r(),
                compositeScore: aggScore,
                priorityCategory: category,
                lastCalculated: new Date()
            });
        }

        console.log('✅ Advanced Modules Seeding Completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
}

seedAdvanced();
