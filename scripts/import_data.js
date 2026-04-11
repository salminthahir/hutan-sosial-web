require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Sequelize } = require('sequelize');
const config = require('../config/config.js')[process.env.NODE_ENV || 'development'];

// Initialize Sequelize
const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: false,
        dialectOptions: config.dialectOptions
    }
);

const CSV_PATH = path.join(__dirname, '../../CSV/Daftar SK Izin PS Maluku Utara update 2025.csv');

// Known typos mapping
const COMMODITY_MAPPINGS = {
    'rumout': 'Rumput Laut',
    'budidaya rumout laut': 'Rumput Laut',
    'cemgleh': 'Cengkeh',
    'coklat': 'Cokelat',
    'mannga': 'Mangga',
    'ekowisara': 'Ekowisata',
    'ekwisata': 'Ekowisata',
    'ekwisata terumbu karang': 'Ekowisata Terumbu Karang',
    'langsa': 'Langsat',
    'gufasa': 'Gofasa',
    'tofiri': 'Kayu Tafiri',
    'manggrov': 'Mangrove',
    'jambu mente': 'Jambu Mete'
};

// Start Case Helper
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}


// Helper to parse numbers "1.234,56" -> 1234.56 or "100" -> 100
function parseNumber(str) {
    if (!str) return 0;
    let clean = str.toString().trim();
    if (clean === '-' || clean === '') return 0;

    // Remove thousand separators (.) if present AND decimal is (,)
    if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
        clean = clean.replace(',', '.');
    }

    return parseFloat(clean) || 0;
}

// Helper to parse coordinates
function parseCoord(val) {
    if (!val) return null;
    val = val.toString().trim();
    if (val === '-' || val === '') return null;
    return parseFloat(val);
}

async function importData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Transactional Import
        const transaction = await sequelize.transaction();

        try {
            const results = [];

            // Read CSV
            console.log(`Reading CSV from ${CSV_PATH}...`);
            await new Promise((resolve, reject) => {
                fs.createReadStream(CSV_PATH)
                    .pipe(csv({ separator: ';' }))
                    .on('data', (data) => results.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });

            console.log(`Total rows read: ${results.length}`);

            // CACHES to avoid re-querying
            // Keys MUST MATCH DB Table Names exactly if getOrCreateIndex relies on it
            const cache = {
                Provinces: {},
                Regencies: {},
                Districts: {},
                Villages: {},
                InstitutionTypes: {},
                PSSchemes: {},
                ForestAreaStatuses: {},
                Commodities: {}
            };

            // Pre-fill static data
            const schemes = ['HD', 'HKm', 'HTR', 'HA', 'Kulin KK', 'IPHPS'];
            for (const s of schemes) {
                const [rec] = await sequelize.query(
                    `INSERT INTO "PSSchemes" (code, name, "createdAt", "updatedAt") VALUES (:code, :name, NOW(), NOW()) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
                    { replacements: { code: s, name: s }, type: sequelize.QueryTypes.INSERT, transaction }
                );
                cache.PSSchemes[s] = rec[0].id;
            }

            const instTypes = ['LPHD', 'KTH', 'LD', 'Koperasi', 'KT', 'Gapoktan'];
            for (const t of instTypes) {
                const [rec] = await sequelize.query(
                    `INSERT INTO "InstitutionTypes" (code, name, "createdAt", "updatedAt") VALUES (:code, :name, NOW(), NOW()) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
                    { replacements: { code: t, name: t }, type: sequelize.QueryTypes.INSERT, transaction }
                );
                cache.InstitutionTypes[t] = rec[0].id;
            }

            const fStatuses = ['HL', 'HP', 'HPT', 'HPK', 'APL'];
            for (const f of fStatuses) {
                const [rec] = await sequelize.query(
                    `INSERT INTO "ForestAreaStatuses" (code, name, "createdAt", "updatedAt") VALUES (:code, :name, NOW(), NOW()) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
                    { replacements: { code: f, name: f }, type: sequelize.QueryTypes.INSERT, transaction }
                );
                cache.ForestAreaStatuses[f] = rec[0].id;
            }


            let count = 0;
            for (const row of results) {
                // Skip empty or invalid rows (check essential fields)
                if (!row['NAMA LEMBAGA'] || row['NAMA LEMBAGA'].trim() === '') continue;

                count++;
                // CSV Headers: No;FISIK;PDF;Serah/Terima;X;Y;XY;AEP;BP;JENIS LEMBAGA;NAMA LEMBAGA;NAMA LENGKAP LEMBAGA;NAMA KETUA;KONTAK;DESA;KEC/DISTRIK;KOTA/KAB;PROVINSI;SKEMA;NOMOR IZIN;POTENSI;STATUS SK;TAHUN;LUAS IZIN;LUAS PROSES;STATUS KAWASAN;ANGGOTA;JML KK

                // 1. Regions
                // Real logic for Regions with lookup
                async function getOrCreateIndex(table, col, val, parentCol, parentId) {
                    const key = val + (parentId || '');
                    if (!cache[table]) {
                        console.error(`Cache table ${table} not found!`);
                        return null;
                    }
                    if (!cache[table][key]) {
                        let existing;
                        if (parentId) {
                            [existing] = await sequelize.query(`SELECT id FROM "${table}" WHERE ${col} = :val AND "${parentCol}" = :parentId LIMIT 1`, { replacements: { val, parentId }, type: sequelize.QueryTypes.SELECT, transaction });
                        } else {
                            [existing] = await sequelize.query(`SELECT id FROM "${table}" WHERE ${col} = :val LIMIT 1`, { replacements: { val }, type: sequelize.QueryTypes.SELECT, transaction });
                        }

                        if (existing) {
                            cache[table][key] = existing.id;
                        } else {
                            let q = parentId
                                ? `INSERT INTO "${table}" (${col}, "${parentCol}", "createdAt", "updatedAt") VALUES (:val, :parentId, NOW(), NOW()) RETURNING id`
                                : `INSERT INTO "${table}" (${col}, "createdAt", "updatedAt") VALUES (:val, NOW(), NOW()) RETURNING id`;

                            const [ins] = await sequelize.query(q, { replacements: { val, parentId }, type: sequelize.QueryTypes.INSERT, transaction });
                            cache[table][key] = ins[0].id;
                        }
                    }
                    return cache[table][key];
                }

                // Fix casing
                const fixCase = (s) => s ? s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : '-';
                const provName = (row['PROVINSI'] || 'Maluku Utara').trim();

                const pId = await getOrCreateIndex('Provinces', 'name', fixCase(provName), null, null);
                const rId = await getOrCreateIndex('Regencies', 'name', fixCase(row['KOTA/KAB'] || 'Unknown'), 'provinceId', pId);
                const dId = await getOrCreateIndex('Districts', 'name', fixCase(row['KEC/DISTRIK'] || 'Unknown'), 'regencyId', rId);
                const vId = await getOrCreateIndex('Villages', 'name', fixCase(row['DESA'] || 'Unknown'), 'districtId', dId);

                // 2. Institution
                const typeKey = row['JENIS LEMBAGA'] || 'KTH';
                if (!cache.InstitutionTypes[typeKey]) {
                    // fallback create
                    const [rec] = await sequelize.query(
                        `INSERT INTO "InstitutionTypes" (code, name, "createdAt", "updatedAt") VALUES (:code, :name, NOW(), NOW()) ON CONFLICT (code) DO NOTHING RETURNING id`,
                        { replacements: { code: typeKey, name: typeKey }, type: sequelize.QueryTypes.INSERT, transaction }
                    );
                    // Re-fetch if nothing returned (duplicate)
                    if (rec && rec.length > 0) cache.InstitutionTypes[typeKey] = rec[0].id;
                    else {
                        const [exist] = await sequelize.query(`SELECT id FROM "InstitutionTypes" WHERE code=:code`, { replacements: { code: typeKey }, type: sequelize.QueryTypes.SELECT, transaction });
                        cache.InstitutionTypes[typeKey] = exist.id;
                    }
                }

                const instTypeId = cache.InstitutionTypes[typeKey];

                // Create Institution
                const instNameShort = row['NAMA LEMBAGA'] || '-';
                const instNameFull = row['NAMA LENGKAP LEMBAGA'] || instNameShort;

                const [inst] = await sequelize.query(
                    `INSERT INTO "Institutions" (
                "institutionTypeId", "shortName", "fullName", "chairmanName", 
                "businessPlanStatus", "aepStatus", "createdAt", "updatedAt"
             ) VALUES (
                :typeId, :short, :full, :chair, 
                :bp, :aep, NOW(), NOW()
             ) RETURNING id`,
                    {
                        replacements: {
                            typeId: instTypeId,
                            short: instNameShort,
                            full: instNameFull,
                            chair: row['NAMA KETUA'] || null,
                            bp: row['BP'] && row['BP'] !== '-' ? row['BP'] : null,
                            aep: row['AEP'] === 'OK',
                        },
                        type: sequelize.QueryTypes.INSERT,
                        transaction
                    }
                );
                const instId = inst[0].id;

                // Contact
                if (row['KONTAK'] && row['KONTAK'] !== '-') {
                    await sequelize.query(
                        `INSERT INTO "InstitutionContacts" ("institutionId", "contactType", "contactValue", "isPrimary", "createdAt", "updatedAt") VALUES (:id, 'phone', :val, true, NOW(), NOW())`,
                        { replacements: { id: instId, val: row['KONTAK'] }, type: sequelize.QueryTypes.INSERT, transaction }
                    );
                }

                // Members
                const members = parseInt(row['ANGGOTA']) || 0;
                const kk = parseInt(row['JML KK']) || 0;
                if (members > 0 || kk > 0) {
                    await sequelize.query(
                        `INSERT INTO "InstitutionMembers" ("institutionId", "totalMembers", "totalHouseholds", "yearRecorded", "createdAt", "updatedAt") VALUES (:id, :m, :kk, 2025, NOW(), NOW())`,
                        { replacements: { id: instId, m: members, kk: kk }, type: sequelize.QueryTypes.INSERT, transaction }
                    );
                }

                // 3. Permit
                const schemeKey = row['SKEMA'] || 'HD';
                const schemeId = cache.PSSchemes[schemeKey] || cache.PSSchemes['HD']; // Fallback

                // Geometry
                // Headers X and Y
                const lon = parseCoord(row['X']);
                const lat = parseCoord(row['Y']);
                let geom = null;
                if (lon && lat) {
                    geom = `ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)`;
                }

                const [permit] = await sequelize.query(
                    `INSERT INTO "SocialForestPermits" (
                "institutionId", "villageId", "schemeId", "location", 
                "permitNumber", "permitYear", "permitStatus", 
                "areaPermitted", "areaInProcess",
                "hasPhysicalDoc", "hasPdfDoc", "hasHandover",
                "createdAt", "updatedAt"
            ) VALUES (
                :instId, :villId, :scId, ${geom ? geom : 'NULL'},
                :pNum, :pYear, :pStatus,
                :area, :areaProcess,
                :phys, :pdf, :hand,
                NOW(), NOW()
            ) RETURNING id`,
                    {
                        replacements: {
                            instId: instId,
                            villId: vId,
                            scId: schemeId,
                            pNum: row['NOMOR IZIN'] || '-',
                            pYear: (() => {
                                let y = parseInt(row['TAHUN']);
                                // If year is invalid (< 1990 or > 2030), try extracting from permit number
                                if (!y || y < 1990 || y > 2030) {
                                    const match = (row['NOMOR IZIN'] || '').match(/20\d{2}/);
                                    if (match) y = parseInt(match[0]);
                                    else y = null;
                                }
                                return y;
                            })(),
                            pStatus: row['STATUS SK'] || 'Izin',
                            area: parseNumber(row['LUAS IZIN']),
                            areaProcess: parseNumber(row['LUAS PROSES']),
                            phys: row['FISIK'] === 'OK',
                            pdf: row['PDF'] === 'OK',
                            hand: row['Serah/Terima'] === 'OK',
                        },
                        type: sequelize.QueryTypes.INSERT,
                        transaction
                    }
                );
                const permitId = permit[0].id;

                // Forest Status Association (Many-to-Many)
                const statHutan = row['STATUS KAWASAN'];
                if (statHutan && statHutan !== '-') {
                    // Split if comma
                    const parts = statHutan.split(/,|;/).map(s => s.trim());
                    for (const p of parts) {
                        if (!cache.ForestAreaStatuses[p]) {
                            // create if not exist
                            const [rec] = await sequelize.query(
                                `INSERT INTO "ForestAreaStatuses" (code, name, "createdAt", "updatedAt") VALUES (:code, :name, NOW(), NOW()) ON CONFLICT (code) DO NOTHING RETURNING id`,
                                { replacements: { code: p, name: p }, type: sequelize.QueryTypes.INSERT, transaction }
                            );
                            // fetch if nothing
                            if (rec && rec.length) cache.ForestAreaStatuses[p] = rec[0].id;
                            else {
                                const [exist] = await sequelize.query(`SELECT id FROM "ForestAreaStatuses" WHERE code=:code`, { replacements: { code: p }, type: sequelize.QueryTypes.SELECT, transaction });
                                cache.ForestAreaStatuses[p] = exist.id;
                            }
                        }
                        await sequelize.query(
                            `INSERT INTO "PermitForestStatuses" ("permitId", "statusId", "createdAt", "updatedAt") VALUES (:pid, :sid, NOW(), NOW()) ON CONFLICT DO NOTHING`,
                            { replacements: { pid: permitId, sid: cache.ForestAreaStatuses[p] }, type: sequelize.QueryTypes.INSERT, transaction }
                        );
                    }
                }

                // 4. Commodities
                // "Pala, Cengkeh, Sagu"
                const pot = row['POTENSI'];
                if (pot && pot !== '-') {
                    const parts = pot.split(/,|;/).map(s => s.trim()).filter(s => s.length > 1);
                    for (const cNameRaw of parts) {
                        // Normalize and Fix Typos
                        let cName = cNameRaw;
                        const lowerName = cName.toLowerCase();

                        // Check if numeric (skip)
                        if (/^\d+$/.test(cName)) continue;

                        // Check mapping
                        if (COMMODITY_MAPPINGS[lowerName]) {
                            cName = COMMODITY_MAPPINGS[lowerName];
                        } else {
                            cName = toTitleCase(cName);
                        }

                        const cKey = cName.toLowerCase();
                        if (!cache.Commodities[cKey]) {
                            const [rec] = await sequelize.query(
                                `INSERT INTO "Commodities" (name, "createdAt", "updatedAt") VALUES (:name, NOW(), NOW()) ON CONFLICT (name) DO UPDATE SET "updatedAt"=NOW() RETURNING id`,
                                { replacements: { name: cName }, type: sequelize.QueryTypes.INSERT, transaction }
                            );
                            cache.Commodities[cKey] = rec[0].id;
                        }

                        await sequelize.query(
                            `INSERT INTO "PermitCommodities" ("permitId", "commodityId", "isPrimary", "createdAt", "updatedAt") VALUES (:pid, :cid, false, NOW(), NOW()) ON CONFLICT DO NOTHING`,
                            { replacements: { pid: permitId, cid: cache.Commodities[cKey] }, type: sequelize.QueryTypes.INSERT, transaction }
                        );
                    }
                }
            }

            await transaction.commit();
            console.log(`Successfully imported ${count} valid records!`);

        } catch (error) {
            await transaction.rollback();
            console.error('Import Error:', error);
        }

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        await sequelize.close();
    }
}

importData();
