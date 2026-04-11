require('dotenv').config({ path: '.env.local' });
const db = require('../src/lib/db/models');
const fs = require('fs');

async function run() {
    try {
        await db.sequelize.authenticate();
        const geojson = JSON.parse(fs.readFileSync('d:/Program gue/Perhutanan-Sosial/DataTmp/Definitif_PS_Malut_2025.geojson', 'utf-8'));
        const shpFeatures = geojson.features;

        // Get all DB permits
        const allPermits = await db.SocialForestPermits.findAll({
            attributes: ['id', 'permitNumber', 'permitYear', 'areaPermitted', 'notes'],
            include: [
                { model: db.Institutions, as: 'institution', attributes: ['shortName', 'fullName', 'chairmanName'],
                  include: [{ model: db.InstitutionMembers, as: 'members', attributes: ['totalMembers', 'totalHouseholds'] }]
                },
                { model: db.PSSchemes, as: 'scheme', attributes: ['code'] },
                { model: db.Villages, as: 'village', attributes: ['name'], include: [
                    { model: db.Districts, as: 'district', attributes: ['name'], include: [
                        { model: db.Regencies, as: 'regency', attributes: ['name'] }
                    ]}
                ]}
            ]
        });

        // Normalize function: remove spaces, dots, dashes, slashes, lowercase
        const normalize = (str) => (str || '').toString().replace(/[\s\.\-\/\,]+/g, '').toLowerCase();

        // Matching by Nomor_SK
        const matched = [];
        const unmatchedShp = [];
        const unmatchedDb = [];
        const dbUsed = new Set();

        for (const feat of shpFeatures) {
            const shpSK = feat.properties.Nomor_SK;
            const nShp = normalize(shpSK);
            
            let bestMatch = null;
            for (const dbP of allPermits) {
                const nDb = normalize(dbP.permitNumber);
                if (nShp === nDb) {
                    bestMatch = dbP;
                    break;
                }
            }

            if (bestMatch) {
                dbUsed.add(bestMatch.id);
                matched.push({
                    shpSK: shpSK,
                    dbSK: bestMatch.permitNumber,
                    dbId: bestMatch.id,
                    shpNamaLembaga: feat.properties.NAMA_LEMBA,
                    dbNamaLembaga: bestMatch.institution?.shortName,
                    shpKabupaten: feat.properties.KAB__KOTA,
                    dbKabupaten: bestMatch.village?.district?.regency?.name,
                    shpKecamatan: feat.properties.KECAMATAN,
                    dbKecamatan: bestMatch.village?.district?.name,
                    shpDesa: feat.properties.DESA_KEL,
                    dbDesa: bestMatch.village?.name,
                    shpLuas: feat.properties.Luas_Total,
                    dbLuas: parseFloat(bestMatch.areaPermitted),
                    shpJumlahKK: feat.properties.Jumlah_KK,
                    dbJumlahKK: bestMatch.institution?.members?.[0]?.totalHouseholds,
                    shpJumlahPen: feat.properties.Jumlah_Pen,
                    dbJumlahMembers: bestMatch.institution?.members?.[0]?.totalMembers,
                    shpSkema: feat.properties.SKEMA_1,
                    dbSkema: bestMatch.scheme?.code,
                    shpTahun: feat.properties.TAHUN,
                    dbTahun: bestMatch.permitYear,
                    shpNamaKetua: feat.properties.NAMA_KETUA,
                    dbNamaKetua: bestMatch.institution?.chairmanName,
                });
            } else {
                unmatchedShp.push({
                    sk: shpSK,
                    nama: feat.properties.NAMA_LEMBA,
                    kab: feat.properties.KAB__KOTA,
                    tahun: feat.properties.TAHUN,
                    luas: feat.properties.Luas_Total,
                });
            }
        }

        for (const dbP of allPermits) {
            if (!dbUsed.has(dbP.id)) {
                unmatchedDb.push({
                    id: dbP.id,
                    sk: dbP.permitNumber,
                    nama: dbP.institution?.shortName,
                    kab: dbP.village?.district?.regency?.name,
                    tahun: dbP.permitYear,
                    luas: parseFloat(dbP.areaPermitted),
                });
            }
        }

        // Area discrepancy analysis on matched items
        const areaDiscrepancies = matched.filter(m => m.shpLuas && m.dbLuas && Math.abs(m.shpLuas - m.dbLuas) > 1);
        const nameDiscrepancies = matched.filter(m => {
            const nShp = normalize(m.shpNamaLembaga);
            const nDb = normalize(m.dbNamaLembaga);
            return nShp && nDb && nShp !== nDb;
        });

        const report = {
            summary: {
                totalShapefile: shpFeatures.length,
                totalDatabase: allPermits.length,
                totalMatched: matched.length,
                totalUnmatchedShapefile: unmatchedShp.length,
                totalUnmatchedDatabase: unmatchedDb.length,
                areaDiscrepancyCount: areaDiscrepancies.length,
                nameDiscrepancyCount: nameDiscrepancies.length,
            },
            matchedSamples: matched.slice(0, 10),
            areaDiscrepancies: areaDiscrepancies.slice(0, 20),
            nameDiscrepancies: nameDiscrepancies.slice(0, 20),
            unmatchedShapefile: unmatchedShp,
            unmatchedDatabase: unmatchedDb,
        };

        fs.writeFileSync('d:/Program gue/Perhutanan-Sosial/DataTmp/matching_report.json', JSON.stringify(report, null, 2));
        console.log('Matching report written.');
        console.log('Summary:', JSON.stringify(report.summary, null, 2));
    } catch (e) {
        console.error(e.message, e.stack);
    } finally {
        await db.sequelize.close();
    }
}
run();
