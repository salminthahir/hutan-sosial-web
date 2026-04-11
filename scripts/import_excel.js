/**
 * import_excel.js
 * Imports data from "Rekapitulasi Persetujuan PS Malut.xlsx" into the PostgreSQL database.
 * This REPLACES existing permit data with official data from the Excel file.
 * 
 * Usage: node scripts/import_excel.js
 */

const XLSX = require('xlsx');
const path = require('path');
const {
    sequelize,
    Provinces, Regencies, Districts, Villages,
    Institutions, InstitutionTypes, InstitutionContacts, InstitutionMembers,
    PSSchemes, SocialForestPermits, PermitForestStatuses, ForestAreaStatuses,
    Commodities, PermitCommodities,
    LandCoverTypes, PermitLandCovers, BiophysicalProfiles,
    // Advanced modules to clean up
    CommoditySuitabilities, ProductionRecords, DerivedProducts,
    GroupDemographics, BusinessReadiness,
    Buyers, MarketData,
    EnvironmentalRisks, CarryingCapacity,
    PriorityScores
} = require('../models');

const EXCEL_PATH = path.join(__dirname, '../../Rekapitulasi Persetujuan PS Malut.xlsx');

// ============================================================
// Helpers
// ============================================================
function clean(val) {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    if (s === '' || s === '-' || s === 'None' || s === 'none') return null;
    return s;
}

function cleanNum(val) {
    if (val === null || val === undefined) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
}

function parseCommodityList(raw) {
    if (!raw) return [];
    return raw
        .replace(/ dan /gi, ', ')
        .replace(/\//g, ', ')
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s !== '-');
}

// ============================================================
// Main Import
// ============================================================
async function importExcel() {
    const t = await sequelize.transaction();

    try {
        console.log('📊 Reading Excel file...');
        const wb = XLSX.readFile(EXCEL_PATH);
        const ws = wb.Sheets['KPS'];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

        // Row 0 = header, Row 1 = sub-header, Row 2 = column numbers, Row 3+ = data
        // Find data rows (rows with a number in column B index=1)
        const dataRows = [];
        let currentPermitRow = null;

        for (let i = 3; i < rows.length; i++) {
            const row = rows[i];
            const num = clean(row[1]); // Column B = NO.
            if (num && !isNaN(parseInt(num))) {
                // This is a new permit row
                currentPermitRow = {
                    rowIndex: i,
                    pjPelaksana: clean(row[0]),
                    namaLembaga: clean(row[2]),
                    kabKota: clean(row[3]),
                    kecamatan: clean(row[4]),
                    desa: clean(row[5]),
                    skema: clean(row[6]),
                    namaKetua: clean(row[7]),
                    noHpKetua: clean(row[8]),
                    tahun: cleanNum(row[9]),
                    skNomor: clean(row[10]),
                    skTanggal: clean(row[11]),
                    luasTotal: cleanNum(row[12]),
                    luasHL: cleanNum(row[13]),
                    luasHPT: cleanNum(row[14]),
                    luasHP: cleanNum(row[15]),
                    luasHPK: cleanNum(row[16]),
                    pengurusJumlah: cleanNum(row[17]),
                    pengurusL: cleanNum(row[18]),
                    pengurusP: cleanNum(row[19]),
                    jumlahKK: cleanNum(row[20]),
                    rkpsStatus: clean(row[21]),
                    penandaanBatas: clean(row[22]),
                    potensiHHK: clean(row[23]),
                    potensiHHBK: clean(row[24]),
                    jasaLingkungan: clean(row[25]),
                    wilayahKPH: clean(row[26]),
                    penyuluhNama: clean(row[27]),
                    penyuluhHP: clean(row[28]),
                    coordX: cleanNum(row[36]),
                    coordY: cleanNum(row[37]),
                    // Land cover (cols 49-54)
                    hutanPrimer: clean(row[49]),
                    hutanSekunder: clean(row[50]),
                    semakTua: clean(row[51]),
                    semakMuda: clean(row[52]),
                    hutanTanaman: clean(row[53]),
                    pertanianLahanKering: clean(row[54]),
                    // KUPS entries for this permit
                    kupsEntries: [],
                };
                // Check if this row itself has a KUPS entry (cols 55-67)
                const kupsName = clean(row[55]);
                if (kupsName) {
                    currentPermitRow.kupsEntries.push({
                        name: kupsName,
                        ketua: clean(row[56]),
                        anggota: clean(row[57]),
                        komoditasUsaha: clean(row[58]),
                        kapasitasUsaha: clean(row[59]),
                        nib: clean(row[60]),
                        aksesModal: clean(row[61]),
                        kelas: clean(row[62]),
                        offtaker: clean(row[63]),
                        harga: clean(row[64]),
                        volume: clean(row[65]),
                        biayaAngkut: clean(row[66]),
                        peluangEkspor: clean(row[67]),
                    });
                }
                dataRows.push(currentPermitRow);
            } else if (currentPermitRow) {
                // Continuation row (KUPS entry for previous permit)
                const kupsName = clean(rows[i][55]);
                if (kupsName) {
                    currentPermitRow.kupsEntries.push({
                        name: kupsName,
                        ketua: clean(rows[i][56]),
                        anggota: clean(rows[i][57]),
                        komoditasUsaha: clean(rows[i][58]),
                        kapasitasUsaha: clean(rows[i][59]),
                        nib: clean(rows[i][60]),
                        aksesModal: clean(rows[i][61]),
                        kelas: clean(rows[i][62]),
                        offtaker: clean(rows[i][63]),
                        harga: clean(rows[i][64]),
                        volume: clean(rows[i][65]),
                        biayaAngkut: clean(rows[i][66]),
                        peluangEkspor: clean(rows[i][67]),
                    });
                }
            }
        }

        console.log(`📋 Parsed ${dataRows.length} permits from Excel`);

        // ============================================================
        // STEP 0: Clean old data
        // ============================================================
        console.log('🧹 Cleaning old data...');
        await PriorityScores.destroy({ where: {}, transaction: t });
        await CarryingCapacity.destroy({ where: {}, transaction: t });
        await EnvironmentalRisks.destroy({ where: {}, transaction: t });
        await MarketData.destroy({ where: {}, transaction: t });
        await BusinessReadiness.destroy({ where: {}, transaction: t });
        await GroupDemographics.destroy({ where: {}, transaction: t });
        await CommoditySuitabilities.destroy({ where: {}, transaction: t });
        await PermitLandCovers.destroy({ where: {}, transaction: t });
        await BiophysicalProfiles.destroy({ where: {}, transaction: t });
        await ProductionRecords.destroy({ where: {}, transaction: t });
        await PermitCommodities.destroy({ where: {}, transaction: t });
        await PermitForestStatuses.destroy({ where: {}, transaction: t });
        await SocialForestPermits.destroy({ where: {}, transaction: t });
        await InstitutionContacts.destroy({ where: {}, transaction: t });
        await InstitutionMembers.destroy({ where: {}, transaction: t });
        await Institutions.destroy({ where: {}, transaction: t });
        console.log('  ✅ Old data cleaned');

        // ============================================================
        // STEP A: Region (Province → Regency → District → Village)
        // ============================================================
        console.log('🗺️  Importing regions...');
        const [province] = await Provinces.findOrCreate({
            where: { name: 'Maluku Utara' },
            defaults: { name: 'Maluku Utara', code: '82' },
            transaction: t
        });

        const regencyCache = {};
        const districtCache = {};
        const villageCache = {};

        for (const row of dataRows) {
            if (!row.kabKota) continue;
            const regKey = row.kabKota;
            if (!regencyCache[regKey]) {
                const isKota = regKey.toLowerCase().startsWith('kota');
                const [reg] = await Regencies.findOrCreate({
                    where: { name: regKey },
                    defaults: { name: regKey, code: null, type: isKota ? 'Kota' : 'Kabupaten', provinceId: province.id },
                    transaction: t
                });
                regencyCache[regKey] = reg.id;
            }

            if (row.kecamatan) {
                const distKey = `${regKey}|${row.kecamatan}`;
                if (!districtCache[distKey]) {
                    const [dist] = await Districts.findOrCreate({
                        where: { name: row.kecamatan, regencyId: regencyCache[regKey] },
                        defaults: { name: row.kecamatan, code: null, regencyId: regencyCache[regKey] },
                        transaction: t
                    });
                    districtCache[distKey] = dist.id;
                }

                if (row.desa) {
                    const vilKey = `${distKey}|${row.desa}`;
                    if (!villageCache[vilKey]) {
                        const [vil] = await Villages.findOrCreate({
                            where: { name: row.desa, districtId: districtCache[distKey] },
                            defaults: { name: row.desa, code: null, districtId: districtCache[distKey] },
                            transaction: t
                        });
                        villageCache[vilKey] = vil.id;
                    }
                }
            }
        }
        console.log(`  ✅ ${Object.keys(regencyCache).length} regencies, ${Object.keys(districtCache).length} districts, ${Object.keys(villageCache).length} villages`);

        // ============================================================
        // STEP B: Schemes
        // ============================================================
        console.log('📜 Importing schemes...');
        const schemeMap = {};
        const schemeDefs = [
            { code: 'HD', name: 'Hutan Desa', description: 'Hutan dikelola oleh lembaga desa' },
            { code: 'HKm', name: 'Hutan Kemasyarakatan', description: 'Hutan dikelola oleh masyarakat' },
            { code: 'HTR', name: 'Hutan Tanaman Rakyat', description: 'Hutan tanaman yang dikelola rakyat' },
        ];
        for (const s of schemeDefs) {
            const [rec] = await PSSchemes.findOrCreate({
                where: { code: s.code },
                defaults: s,
                transaction: t
            });
            schemeMap[s.code] = rec.id;
        }

        // ============================================================
        // STEP C: Commodities (HHBK / HHK / Jasa Lingkungan)
        // ============================================================
        console.log('🌿 Importing commodities...');
        const commodityCache = {};

        async function getOrCreateCommodity(name, category) {
            const key = `${name}|${category}`;
            if (commodityCache[key]) return commodityCache[key];
            const [rec] = await Commodities.findOrCreate({
                where: { name },
                defaults: { name, category, description: null },
                transaction: t
            });
            // Update category if existing record differs
            if (rec.category !== category) {
                await rec.update({ category }, { transaction: t });
            }
            commodityCache[key] = rec.id;
            return rec.id;
        }

        // Parse all unique commodity sets from data rows 
        for (const row of dataRows) {
            const hhbkList = parseCommodityList(row.potensiHHBK);
            for (const name of hhbkList) {
                await getOrCreateCommodity(name, 'HHBK');
            }
            const hhkList = parseCommodityList(row.potensiHHK);
            for (const name of hhkList) {
                await getOrCreateCommodity(name, 'HHK');
            }
            if (row.jasaLingkungan) {
                const jlList = parseCommodityList(row.jasaLingkungan);
                for (const name of jlList) {
                    await getOrCreateCommodity(name, 'Jasa Lingkungan');
                }
            }
        }
        console.log(`  ✅ ${Object.keys(commodityCache).length} commodities imported`);

        // ============================================================
        // STEP D: Forest Area Statuses
        // ============================================================
        console.log('🌲 Importing forest area statuses...');
        const forestStatusMap = {};
        const statusDefs = [
            { code: 'HL', name: 'Hutan Lindung' },
            { code: 'HPT', name: 'Hutan Produksi Terbatas' },
            { code: 'HP', name: 'Hutan Produksi' },
            { code: 'HPK', name: 'Hutan Produksi Konversi' },
        ];
        for (const s of statusDefs) {
            const [rec] = await ForestAreaStatuses.findOrCreate({
                where: { code: s.code },
                defaults: s,
                transaction: t
            });
            forestStatusMap[s.code] = rec.id;
        }

        // ============================================================
        // STEP E: Land Cover Types
        // ============================================================
        console.log('🌳 Importing land cover types...');
        const landCoverDefs = [
            { code: 'HP', name: 'Hutan Primer' },
            { code: 'HS', name: 'Hutan Sekunder' },
            { code: 'ST', name: 'Semak Tua' },
            { code: 'SM', name: 'Semak Muda' },
            { code: 'HT', name: 'Hutan Tanaman' },
            { code: 'PLK', name: 'Pertanian Lahan Kering' },
        ];
        const landCoverMap = {};
        for (const lc of landCoverDefs) {
            const [rec] = await LandCoverTypes.findOrCreate({
                where: { code: lc.code },
                defaults: lc,
                transaction: t
            });
            landCoverMap[lc.code] = rec.id;
        }

        // ============================================================
        // STEP F: Import Permits + Relations
        // ============================================================
        console.log('📝 Importing 327 permits...');
        let permitCount = 0;
        let institutionCount = 0;

        for (const row of dataRows) {
            // -- Institution --
            const instName = row.namaLembaga || `Lembaga ${permitCount + 1}`;
            const institution = await Institutions.create({
                shortName: instName,
                fullName: instName,
                chairmanName: row.namaKetua,
                isActive: true,
                businessPlanStatus: row.rkpsStatus,
            }, { transaction: t });
            institutionCount++;

            // -- Institution Contacts --
            if (row.noHpKetua) {
                await InstitutionContacts.create({
                    institutionId: institution.id,
                    contactType: 'ketua',
                    contactValue: row.noHpKetua,
                    isPrimary: true,
                }, { transaction: t });
            }
            if (row.penyuluhNama || row.penyuluhHP) {
                await InstitutionContacts.create({
                    institutionId: institution.id,
                    contactType: 'penyuluh',
                    contactValue: [row.penyuluhNama, row.penyuluhHP].filter(Boolean).join(' | '),
                    isPrimary: false,
                }, { transaction: t });
            }

            // -- Institution Members --
            if (row.jumlahKK || row.pengurusJumlah) {
                await InstitutionMembers.create({
                    institutionId: institution.id,
                    totalMembers: row.pengurusJumlah ? Math.round(row.pengurusJumlah) : null,
                    totalHouseholds: row.jumlahKK ? Math.round(row.jumlahKK) : null,
                    yearRecorded: row.tahun ? Math.round(row.tahun) : 2024,
                }, { transaction: t });
            }

            // -- Village ID lookup --
            let villageId = null;
            if (row.kabKota && row.kecamatan && row.desa) {
                const vilKey = `${row.kabKota}|${row.kecamatan}|${row.desa}`;
                villageId = villageCache[vilKey] || null;
            }

            // -- Scheme ID --
            const schemeId = row.skema ? (schemeMap[row.skema] || null) : null;

            // -- Location (POINT) --
            let location = null;
            if (row.coordX && row.coordY) {
                // Convert from degrees/minutes format if needed, or use directly
                // The Excel stores as integer format like 128016 = 128°01.6'
                // Let's parse: first 3 digits = degrees, next 2 = minutes, rest = decimal
                const lng = parseCoord(row.coordX);
                const lat = parseCoord(row.coordY);
                if (lng && lat) {
                    location = { type: 'Point', coordinates: [lng, lat] };
                }
            }

            // -- Create Permit --
            const permit = await SocialForestPermits.create({
                institutionId: institution.id,
                villageId,
                schemeId,
                location,
                permitNumber: row.skNomor,
                permitYear: row.tahun ? Math.round(row.tahun) : null,
                permitStatus: 'Izin',
                areaPermitted: row.luasTotal,
                validFrom: parseSkDate(row.skTanggal),
                notes: row.wilayahKPH ? `KPH: ${row.wilayahKPH}` : null,
            }, { transaction: t });

            // -- Forest Status Breakdown --
            const statusPairs = [
                { code: 'HL', area: row.luasHL },
                { code: 'HPT', area: row.luasHPT },
                { code: 'HP', area: row.luasHP },
                { code: 'HPK', area: row.luasHPK },
            ];
            for (const sp of statusPairs) {
                if (sp.area && sp.area > 0 && forestStatusMap[sp.code]) {
                    await PermitForestStatuses.create({
                        permitId: permit.id,
                        statusId: forestStatusMap[sp.code],
                    }, { transaction: t });
                }
            }

            // -- Commodities M:N --
            const allCommodities = new Set();
            const hhbkList = parseCommodityList(row.potensiHHBK);
            for (const name of hhbkList) {
                const cid = commodityCache[`${name}|HHBK`];
                if (cid && !allCommodities.has(cid)) {
                    allCommodities.add(cid);
                    await PermitCommodities.create({
                        permitId: permit.id,
                        commodityId: cid,
                        isPrimary: hhbkList.indexOf(name) === 0,
                    }, { transaction: t });
                }
            }
            const hhkList = parseCommodityList(row.potensiHHK);
            for (const name of hhkList) {
                const cid = commodityCache[`${name}|HHK`];
                if (cid && !allCommodities.has(cid)) {
                    allCommodities.add(cid);
                    await PermitCommodities.create({
                        permitId: permit.id,
                        commodityId: cid,
                        isPrimary: false,
                    }, { transaction: t });
                }
            }
            if (row.jasaLingkungan) {
                const jlList = parseCommodityList(row.jasaLingkungan);
                for (const name of jlList) {
                    const cid = commodityCache[`${name}|Jasa Lingkungan`];
                    if (cid && !allCommodities.has(cid)) {
                        allCommodities.add(cid);
                        await PermitCommodities.create({
                            permitId: permit.id,
                            commodityId: cid,
                            isPrimary: false,
                        }, { transaction: t });
                    }
                }
            }

            // -- Land Covers --
            const lcPairs = [
                { code: 'HP', val: row.hutanPrimer },
                { code: 'HS', val: row.hutanSekunder },
                { code: 'ST', val: row.semakTua },
                { code: 'SM', val: row.semakMuda },
                { code: 'HT', val: row.hutanTanaman },
                { code: 'PLK', val: row.pertanianLahanKering },
            ];
            for (const lc of lcPairs) {
                const areaHa = cleanNum(lc.val);
                if (areaHa && areaHa > 0 && landCoverMap[lc.code]) {
                    // Excel values are in hectares, compute percentage from total area
                    const pct = row.luasTotal && row.luasTotal > 0
                        ? parseFloat(((areaHa / row.luasTotal) * 100).toFixed(2))
                        : null;
                    await PermitLandCovers.create({
                        permitId: permit.id,
                        landCoverTypeId: landCoverMap[lc.code],
                        coverPercentage: pct,
                        areaHectares: parseFloat(areaHa.toFixed(2)),
                        yearRecorded: row.tahun ? Math.round(row.tahun) : 2024,
                    }, { transaction: t });
                }
            }

            permitCount++;
            if (permitCount % 50 === 0) {
                console.log(`  ... ${permitCount}/${dataRows.length} permits imported`);
            }
        }

        console.log(`  ✅ ${permitCount} permits, ${institutionCount} institutions imported`);

        // ============================================================
        // COMMIT
        // ============================================================
        await t.commit();
        console.log('\n🎉 Import completed successfully!');
        console.log(`   Permits: ${permitCount}`);
        console.log(`   Institutions: ${institutionCount}`);
        console.log(`   Regencies: ${Object.keys(regencyCache).length}`);
        console.log(`   Districts: ${Object.keys(districtCache).length}`);
        console.log(`   Villages: ${Object.keys(villageCache).length}`);
        console.log(`   Commodities: ${Object.keys(commodityCache).length}`);

        process.exit(0);

    } catch (error) {
        await t.rollback();
        console.error('❌ Import failed:', error);
        process.exit(1);
    }
}

// ============================================================
// Coordinate Parser
// ============================================================
function parseCoord(val) {
    if (!val) return null;
    const n = parseFloat(val);
    if (isNaN(n)) return null;

    // Values in the Excel are stored as integer-like: e.g. 128016 = 128.016 degrees
    // or could be actual decimal degrees like 127.5
    // If the number is > 1000, it's in the format DDDMMM where DDD = degrees, MMM = fractional minutes
    if (n > 360) {
        // Format: DDDMMM.x → interpret as DDD + MM.Mx / 60
        const str = n.toString();
        if (str.length >= 6) {
            const deg = parseInt(str.substring(0, 3));
            const min = parseFloat(str.substring(3)) / 1000 * 60;
            return deg + min / 60;
        }
        return null;
    }
    return n;
}

// ============================================================
// SK Date parser
// ============================================================
function parseSkDate(val) {
    if (!val) return null;
    // Handle various date formats:
    // "17 Oktober 2022", "06 April 2010", etc.
    const months = {
        'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
        'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
        'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
    };
    const parts = String(val).trim().split(/\s+/);
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = months[parts[1].toLowerCase()];
        const year = parts[2];
        if (month && year) return `${year}-${month}-${day}`;
    }
    // Try ISO date
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return null;
}

// ============================================================
// Run
// ============================================================
importExcel();
