// Import KUPS data from DATA KUPS MALUKU UTARA.xlsx into database
// Matches KUPS to SocialForestPermits via "Nomor SK Persetujuan" and "Nama Lembaga"

const XLSX = require('xlsx');
const path = require('path');
const { Sequelize } = require('sequelize');
const pg = require('pg');

// --- DB Setup (inline to avoid Turbopack issues) ---
const dbConfig = {
    username: process.env.DB_USERNAME || 'hutan_kita_user',
    password: process.env.DB_PASSWORD || 'hutan_kita_password',
    database: process.env.DB_NAME || 'hutan_kita_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectModule: pg,
};

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

// --- Normalize for matching ---
function normalizeForMatch(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\./g, '')
        .replace(/^(hutan desa|hutan kemasyarakatan|hutan tanaman rakyat|hutan adat|kemitraan kehutanan|izin pemanfaatan hutan perhutanan sosial)\s+/i, '')
        .replace(/\s+(ld|kth|lphd|koperasi|poktan|gapoktanhut|gapoktan|kt|lpmd)$/i, '')
        .replace(/^(lphd|ld|kth|koperasi|poktan|gapoktanhut|gapoktan|kt)\.\s*/i, '')
        .trim();
}

function normalizeSK(sk) {
    if (!sk) return '';
    // Remove trailing date text like "tanggal 30 September 2022"
    return sk.replace(/\s*tanggal\s+.*/i, '').trim();
}

async function importKupsData() {
    const t = await sequelize.transaction();
    
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected\n');

        // 1. Read Excel
        const filePath = path.join(__dirname, '..', '..', 'CSV', 'DATA KUPS MALUKU UTARA.xlsx');
        const wb = XLSX.readFile(filePath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(ws);
        
        // Filter out non-data rows (the first row seems to be a sub-header with numbers)
        const validData = excelData.filter(row => {
            const name = row['Nama KUPS'];
            // Skip if name is a number (sub-header row) or empty
            return name && typeof name === 'string' && isNaN(name);
        });
        
        console.log(`📊 Excel: ${excelData.length} raw rows → ${validData.length} valid KUPS records\n`);

        // 2. Load all permits with institutions
        const [permits] = await sequelize.query(`
            SELECT 
                p.id, 
                p."permitNumber", 
                p."permitYear",
                i."fullName" as "institutionFullName", 
                i."shortName" as "institutionShortName"
            FROM "SocialForestPermits" p
            LEFT JOIN "Institutions" i ON p."institutionId" = i.id
        `, { transaction: t });

        console.log(`💾 DB: ${permits.length} permits loaded\n`);

        // 3. Build lookup index by SK number
        const permitBySK = {};
        const permitByInstitution = {};
        
        permits.forEach(p => {
            if (p.permitNumber) {
                const normSK = normalizeSK(p.permitNumber).toLowerCase();
                permitBySK[normSK] = p;
            }
            const instName = normalizeForMatch(p.institutionFullName || p.institutionShortName || '');
            if (instName) {
                permitByInstitution[instName] = p;
            }
        });

        // 4. Process each KUPS row
        const kupsRecords = [];
        const matched = [];
        const unmatched = [];
        const skippedDuplicate = [];

        for (const row of validData) {
            const namaKups = (row['Nama KUPS'] || '').trim();
            const ketuaKups = (row['Ketua Kelompok KUPS'] || '').trim() || null;
            const tahun = row['Tahun Pembentukan'];
            const komoditas = (row['Potensi / Komoditas'] || '').trim() || null;
            const kelasKups = (row['Kelas KUPS'] || '').trim() || null;
            const skPersetujuan = (row['Nomor SK Persetujuan'] || '').trim();
            const skKups = (row['Nomor SK KUPS'] || '').trim() || null;
            const jenisUsaha = (row['Jenis Usaha'] || '').trim() || null;
            const klaster = (row['Klaster'] || '').trim() || null;
            const noHP = row['Nomor Kontak'] ? String(row['Nomor Kontak']).trim() : null;
            const namaLembaga = (row['Nama Lembaga'] || '').trim();
            const tahunGold = row['Tahun Peningkatan GOLD'] || null;
            const alamat = (row['Alamat Lengkap'] || '').trim() || null;

            if (!namaKups) continue;

            // Try to match to a permit
            let permitMatch = null;

            // Strategy 1: Match by SK Persetujuan number
            if (skPersetujuan) {
                const normSK = normalizeSK(skPersetujuan).toLowerCase();
                // Exact match
                permitMatch = permitBySK[normSK];
                
                // Partial match: check if DB SK contains the Excel SK or vice versa
                if (!permitMatch) {
                    for (const [dbSK, p] of Object.entries(permitBySK)) {
                        if (dbSK.includes(normSK) || normSK.includes(dbSK)) {
                            permitMatch = p;
                            break;
                        }
                    }
                }
            }

            // Strategy 2: Match by institution name
            if (!permitMatch && namaLembaga) {
                const normInst = normalizeForMatch(namaLembaga);
                permitMatch = permitByInstitution[normInst];
                
                // Fuzzy: check if any DB institution name contains the Excel name
                if (!permitMatch) {
                    for (const [dbInst, p] of Object.entries(permitByInstitution)) {
                        if (dbInst.includes(normInst) || normInst.includes(dbInst)) {
                            permitMatch = p;
                            break;
                        }
                    }
                }
            }

            const record = {
                name: namaKups,
                chairmanName: ketuaKups,
                totalMembers: null, // Not in this Excel
                commodities: komoditas,
                businessClass: kelasKups,
                permitId: permitMatch ? permitMatch.id : null,
                establishedYear: (typeof tahun === 'number' && tahun > 1990 && tahun < 2030) ? tahun : null,
                skNumber: skKups,
                businessType: jenisUsaha,
                cluster: klaster,
                phoneNumber: noHP,
                goldUpgradeYear: (typeof tahunGold === 'number' && tahunGold > 2000 && tahunGold < 2030) ? tahunGold : null,
                address: alamat,
            };

            kupsRecords.push(record);

            if (permitMatch) {
                matched.push({ kups: namaKups, permit: permitMatch.id, institution: permitMatch.institutionShortName || permitMatch.institutionFullName });
            } else {
                unmatched.push({ kups: namaKups, lembaga: namaLembaga, sk: skPersetujuan });
            }
        }

        console.log('=== MATCHING RESULTS ===');
        console.log(`  ✅ Matched to permit: ${matched.length}`);
        console.log(`  ❌ Unmatched (no permit link): ${unmatched.length}`);
        console.log(`  📝 Total KUPS to insert: ${kupsRecords.length}\n`);

        // 5. Clear old KUPS data and insert new
        const oldCount = await sequelize.query('SELECT COUNT(*) as count FROM "KUPS"', { type: Sequelize.QueryTypes.SELECT, transaction: t });
        console.log(`  🗑️  Clearing ${oldCount[0].count} old KUPS records...`);
        
        await sequelize.query('DELETE FROM "KUPS"', { transaction: t });

        // Bulk insert in batches
        const batchSize = 50;
        let inserted = 0;
        for (let i = 0; i < kupsRecords.length; i += batchSize) {
            const batch = kupsRecords.slice(i, i + batchSize);
            const values = batch.map(r => `(
                ${sequelize.escape(r.name)},
                ${r.chairmanName ? sequelize.escape(r.chairmanName) : 'NULL'},
                ${r.totalMembers ? sequelize.escape(r.totalMembers) : 'NULL'},
                ${r.commodities ? sequelize.escape(r.commodities) : 'NULL'},
                ${r.businessClass ? sequelize.escape(r.businessClass) : 'NULL'},
                ${r.permitId || 'NULL'},
                ${r.establishedYear || 'NULL'},
                ${r.skNumber ? sequelize.escape(r.skNumber) : 'NULL'},
                ${r.businessType ? sequelize.escape(r.businessType) : 'NULL'},
                ${r.cluster ? sequelize.escape(r.cluster) : 'NULL'},
                ${r.phoneNumber ? sequelize.escape(r.phoneNumber) : 'NULL'},
                ${r.goldUpgradeYear || 'NULL'},
                ${r.address ? sequelize.escape(r.address) : 'NULL'},
                NOW(), NOW()
            )`).join(',\n');

            await sequelize.query(`
                INSERT INTO "KUPS" (
                    "name", "chairmanName", "totalMembers", "commodities", 
                    "businessClass", "permitId", "establishedYear", "skNumber",
                    "businessType", "cluster", "phoneNumber", "goldUpgradeYear",
                    "address", "createdAt", "updatedAt"
                ) VALUES ${values}
            `, { transaction: t });
            
            inserted += batch.length;
        }

        console.log(`  ✅ Inserted ${inserted} KUPS records\n`);

        // 6. Commit
        await t.commit();
        console.log('✅ IMPORT COMPLETE!\n');

        // 7. Print unmatched for review
        if (unmatched.length > 0) {
            console.log('=== UNMATCHED KUPS (no permit link) ===');
            console.log('These KUPS are stored but NOT linked to a permit:');
            const uniqueUnmatched = [...new Map(unmatched.map(u => [u.lembaga, u])).values()];
            uniqueUnmatched.forEach((u, i) => {
                console.log(`  ${i+1}. Lembaga: "${u.lembaga}" | SK: "${u.sk}"`);
            });
            console.log(`\n  Total unique unmatched institutions: ${uniqueUnmatched.length}`);
        }

        // 8. Final verification
        const [verifyResult] = await sequelize.query(`
            SELECT 
                COUNT(*) as total,
                COUNT("permitId") as with_permit,
                COUNT(*) - COUNT("permitId") as without_permit,
                COUNT("establishedYear") as with_year,
                COUNT("skNumber") as with_sk_kups,
                COUNT("businessType") as with_business_type,
                COUNT("cluster") as with_cluster,
                COUNT("phoneNumber") as with_phone,
                COUNT("address") as with_address
            FROM "KUPS"
        `);
        console.log('\n=== VERIFICATION ===');
        console.log(JSON.stringify(verifyResult[0], null, 2));

    } catch (err) {
        await t.rollback();
        console.error('❌ Import failed:', err);
    } finally {
        await sequelize.close();
    }
}

importKupsData();
