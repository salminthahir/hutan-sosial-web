require('dotenv').config({ path: '.env.local' });
const db = require('../src/lib/db/models');
const fs = require('fs');

async function run() {
    const report = {};

    try {
        await db.sequelize.authenticate();
        console.log('DB connected.');

        // ===== 1. SHAPEFILE DATA AUDIT =====
        const geojson = JSON.parse(fs.readFileSync('d:/Program gue/Perhutanan-Sosial/DataTmp/Definitif_PS_Malut_2025.geojson', 'utf-8'));
        const shpFeatures = geojson.features;
        
        report.shapefile = {
            totalFeatures: shpFeatures.length,
            allColumns: Object.keys(shpFeatures[0].properties),
            geometryTypes: [...new Set(shpFeatures.map(f => f.geometry?.type))],
        };

        // Extract ALL unique SK numbers from shapefile
        const shpSKs = shpFeatures.map(f => f.properties.No_SK || f.properties.no_sk || '').filter(Boolean);
        // Try all possible SK column names
        const props0 = shpFeatures[0].properties;
        const allKeys = Object.keys(props0);
        
        // Find the SK column
        const skColCandidates = allKeys.filter(k => k.toLowerCase().includes('sk') || k.toLowerCase().includes('no_'));
        report.shapefile.skColumnCandidates = skColCandidates;
        
        // Collect all unique values per column to understand what each column holds
        const colSummary = {};
        for (const key of allKeys) {
            const values = shpFeatures.map(f => f.properties[key]);
            const nonNull = values.filter(v => v !== null && v !== undefined && v !== '' && v !== 0 && v !== '-');
            const unique = [...new Set(nonNull)];
            colSummary[key] = {
                totalNonNull: nonNull.length,
                totalNull: values.length - nonNull.length,
                uniqueCount: unique.length,
                sampleValues: unique.slice(0, 5)
            };
        }
        report.shapefile.columnDetails = colSummary;

        // ===== 2. DATABASE AUDIT =====
        // Count all tables
        const permitCount = await db.SocialForestPermits.count();
        const institutionCount = await db.Institutions.count();
        const membersCount = await db.InstitutionMembers.count();
        const villageCount = await db.Villages.count();
        const districtCount = await db.Districts.count();
        const regencyCount = await db.Regencies.count();
        const provinceCount = await db.Provinces.count();
        const schemeCount = await db.PSSchemes.count();
        const forestStatusCount = await db.ForestAreaStatuses.count();
        const commodityCount = await db.Commodities.count();
        const permitCommodityCount = await db.PermitCommodities.count();
        const biophysicalCount = await db.BiophysicalProfiles.count();
        const landCoverCount = await db.PermitLandCovers.count();
        const groupDemoCount = await db.GroupDemographics.count();
        const businessReadyCount = await db.BusinessReadiness.count();
        const priorityCount = await db.PriorityScores.count();
        const monitoringCount = await db.MonitoringLogs.count();
        const marketCount = await db.MarketData.count();
        const riskCount = await db.EnvironmentalRisks.count();
        const kupsCount = await db.KUPS.count();
        
        report.database = {
            totalPermits: permitCount,
            totalInstitutions: institutionCount,
            totalMembers: membersCount,
            totalVillages: villageCount,
            totalDistricts: districtCount,
            totalRegencies: regencyCount,
            totalProvinces: provinceCount,
            totalSchemes: schemeCount,
            totalForestStatuses: forestStatusCount,
            totalCommodities: commodityCount,
            totalPermitCommodities: permitCommodityCount,
            totalBiophysicalProfiles: biophysicalCount,
            totalLandCovers: landCoverCount,
            totalGroupDemographics: groupDemoCount,
            totalBusinessReadiness: businessReadyCount,
            totalPriorityScores: priorityCount,
            totalMonitoringLogs: monitoringCount,
            totalMarketData: marketCount,
            totalEnvironmentalRisks: riskCount,
            totalKUPS: kupsCount,
        };

        // ===== 3. EXTRACT ALL PERMIT NUMBERS FROM DB =====
        const allPermits = await db.SocialForestPermits.findAll({
            attributes: ['id', 'permitNumber', 'permitYear', 'permitStatus', 'areaPermitted', 'validFrom', 'validUntil', 'hasPhysicalDoc', 'hasPdfDoc', 'pdfUrl', 'notes'],
            include: [
                { model: db.Institutions, as: 'institution', attributes: ['shortName', 'fullName'] },
                { model: db.PSSchemes, as: 'scheme', attributes: ['code', 'name'] },
                { model: db.Villages, as: 'village', attributes: ['name'], include: [
                    { model: db.Districts, as: 'district', attributes: ['name'], include: [
                        { model: db.Regencies, as: 'regency', attributes: ['name'] }
                    ]}
                ]}
            ],
            raw: false, 
        });

        const dbPermitNumbers = allPermits.map(p => p.permitNumber).filter(Boolean);
        report.database.allPermitNumbers = dbPermitNumbers;
        report.database.samplePermits = allPermits.slice(0, 5).map(p => p.toJSON());

        // ===== 4. EXTRACT ALL SK FROM SHAPEFILE =====
        // Find which column contains SK numbers  
        const shpAllSKData = shpFeatures.map(f => ({
            No_SK: f.properties.No_SK,
            Nama_PS: f.properties.Nama_PS,
            Nama_Kelem: f.properties.Nama_Kelem,
            Skema_PS: f.properties.Skema_PS,
            Tanggal_SK: f.properties.Tanggal_SK,
            Luas_Total: f.properties.Luas_Total,
            Jumlah_KK: f.properties.Jumlah_KK,
            Jumlah_Pen: f.properties.Jumlah_Pen,
            Laki_laki: f.properties.Laki_laki,
            Perempuan: f.properties.Perempuan,
            Kabupaten: f.properties.Kabupaten,
            Kecamatan: f.properties.Kecamatan,
            Desa: f.properties.Desa,
            HL: f.properties.HL,
            HP: f.properties.HP,
            HPT: f.properties.HPT,
            HPK: f.properties.HPK,
            Wilayah_UP: f.properties.Wilayah_UP,
            Dokumen_RK: f.properties.Dokumen_RK,
            Penandaan: f.properties.Penandaan,
            HHK: f.properties.HHK,
            HHBK: f.properties.HHBK,
            Jasa_Lingk: f.properties.Jasa_Lingk,
            Penyuluh: f.properties.Penyuluh,
        }));
        report.shapefile.allSKData = shpAllSKData;

        // ===== 5. MATCHING ATTEMPT =====
        // Try to match by permit numbers
        const normalize = (str) => (str || '').toString().replace(/[\s\.\-\/]+/g, '').toLowerCase();
        
        let matchCount = 0;
        let noMatchShp = [];
        let noMatchDb = [];

        for (const shpItem of shpAllSKData) {
            const nShp = normalize(shpItem.No_SK);
            const found = dbPermitNumbers.find(dbSK => normalize(dbSK) === nShp);
            if (found) {
                matchCount++;
            } else {
                noMatchShp.push(shpItem.No_SK);
            }
        }

        const shpNormalized = shpAllSKData.map(s => normalize(s.No_SK));
        for (const dbSK of dbPermitNumbers) {
            const nDb = normalize(dbSK);
            if (!shpNormalized.includes(nDb)) {
                noMatchDb.push(dbSK);
            }
        }

        report.matching = {
            totalMatched: matchCount,
            unmatchedInShapefile: noMatchShp.length,
            unmatchedInDatabase: noMatchDb.length,
            sampleUnmatchedShapefile: noMatchShp.slice(0, 10),
            sampleUnmatchedDatabase: noMatchDb.slice(0, 10),
        };

        // ===== 6. DATA COMPLETENESS CHECK ON DB =====
        const permitsWithBoundary = await db.SocialForestPermits.count({ where: { boundary: { [db.Sequelize.Op.ne]: null } } });
        const permitsWithPdf = await db.SocialForestPermits.count({ where: { hasPdfDoc: true } });
        const permitsWithPhysDoc = await db.SocialForestPermits.count({ where: { hasPhysicalDoc: true } });

        report.database.completeness = {
            permitsWithBoundary,
            permitsWithoutBoundary: permitCount - permitsWithBoundary,
            permitsWithPdf,
            permitsWithPhysDoc,
        };

        // ===== 7. SCHEME COMPARISON =====
        const dbSchemes = await db.PSSchemes.findAll({ raw: true });
        const shpSchemes = [...new Set(shpAllSKData.map(s => s.Skema_PS).filter(Boolean))];
        report.schemeComparison = {
            dbSchemes: dbSchemes.map(s => s.code),
            shpSchemes: shpSchemes,
        };
        
        // ===== 8. REGIONS COMPARISON =====
        const shpKabupaten = [...new Set(shpAllSKData.map(s => s.Kabupaten).filter(Boolean))];
        const shpKecamatan = [...new Set(shpAllSKData.map(s => s.Kecamatan).filter(Boolean))];
        const shpDesa = [...new Set(shpAllSKData.map(s => s.Desa).filter(Boolean))];
        
        const dbRegencies = await db.Regencies.findAll({ attributes: ['name'], raw: true });
        const dbDistricts = await db.Districts.findAll({ attributes: ['name'], raw: true });
        
        report.regionComparison = {
            shpKabupaten,
            shpKecamatan: shpKecamatan.slice(0, 20),
            dbRegencies: dbRegencies.map(r => r.name),
            dbDistricts: dbDistricts.map(d => d.name).slice(0, 20),
        };

        // Write full report
        fs.writeFileSync('d:/Program gue/Perhutanan-Sosial/DataTmp/full_audit_report.json', JSON.stringify(report, null, 2));
        console.log('Full audit report written to DataTmp/full_audit_report.json');

    } catch (e) {
        console.error('Error:', e.message);
        console.error(e.stack);
    } finally {
        await db.sequelize.close();
    }
}
run();
