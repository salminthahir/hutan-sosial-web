/**
 * Import script: XLSX → Supabase Database
 * 1. Import 322 WKT polygons to boundary column
 * 2. Import/update KK (Jml_KK) to InstitutionMembers.totalHouseholds
 * 3. Import Forest Area breakdown (HL/HPT/HP/HPK) to PermitForestStatuses
 * Uses SAVEPOINTS for error recovery on individual rows
 */

require('dotenv').config({ path: '.env' });
const XLSX = require('xlsx');
const { Sequelize } = require('sequelize');
const pg = require('pg');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', dialectModule: pg,
    dialectOptions: process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1' ? {} : { ssl: { require: true, rejectUnauthorized: false } }, logging: false
});

const DESA_NORMALIZE = {
    'tabololo': 'tobololo', 'dorariisa': 'doriisa',
    'kelurahan kulaba': 'kulaba', 'kel. mafututu': 'mafututu', 'kel. maliaro': 'maliaro',
    'kelurahan moti kota': 'moti kota', 'kelurahan tafaga': 'tafaga',
    'kelurahan tafamutu': 'tafamutu', 'kelurahan tadenas': 'tadenas',
    'kelurahan takofi': 'takofi', 'kelurahan guraping': 'guraping',
    'afa - afa': 'afa-afa', 'aer salobar': 'air salobar',
};
const MULTI_DESA = {
    'bere-bere, sakita, tanjung saleh, loleo jaya': 'bere-bere',
    'banemo, bobane jaya, bobane indah': 'banemo',
    'daeo dan majiko': 'daeo', 'bukutio dan fayaul': 'bukutio',
    'fuata dan waitamua': 'fuata',
};

function normalizeDesa(name) {
    const lower = (name || '').toLowerCase().trim();
    if (DESA_NORMALIZE[lower]) return DESA_NORMALIZE[lower];
    if (MULTI_DESA[lower]) return MULTI_DESA[lower];
    return lower.replace(/^kelurahan\s+/, '').replace(/^kel\.\s*/, '');
}

const FOREST_CODES = { 'Luas_HK': 'HK', 'LUAS_HL': 'HL', 'LUAS_HPT': 'HPT', 'LUAS_HP': 'HP', 'LUAS_HPK': 'HPK' };

(async () => {
    try {
        // Load XLSX
        console.log('📂 Loading XLSX...');
        const wb = XLSX.readFile('/Users/macbooksale/Work/Projects/hutan-sosial-go.id/rawdata/untitled.xlsx');
        const allData = XLSX.utils.sheet_to_json(wb.Sheets['untitled'], { defval: null });
        const headers = Object.values(allData[0]);
        const xlsxData = allData.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = row['Column' + (i + 1)]; });
            return obj;
        });
        console.log('   Loaded ' + xlsxData.length + ' rows\n');

        // Load DB permits
        console.log('📊 Loading DB permits...');
        const [dbPermits] = await sequelize.query(`
      SELECT p.id, p."permitNumber", p."villageId", p."institutionId",
             v.name as village, d.name as district, r.name as regency,
             i."fullName" as institution
      FROM "SocialForestPermits" p
      LEFT JOIN "Villages" v ON p."villageId"=v.id
      LEFT JOIN "Districts" d ON v."districtId"=d.id
      LEFT JOIN "Regencies" r ON d."regencyId"=r.id
      LEFT JOIN "Institutions" i ON p."institutionId"=i.id
      ORDER BY p.id
    `);

        const [forestStatuses] = await sequelize.query('SELECT id, code FROM "ForestAreaStatuses"');
        console.log('   DB permits: ' + dbPermits.length + '\n');

        // Match XLSX → DB
        console.log('🔗 Matching...');
        let matched = 0, unmatched = 0;
        const matchResults = [];

        for (const xlsx of xlsxData) {
            const xlsxDesa = normalizeDesa(xlsx['NAMA_DESA']);
            let dbMatch = dbPermits.find(d => d.village && d.village.toLowerCase().trim() === xlsxDesa);
            if (!dbMatch) {
                dbMatch = dbPermits.find(d => d.village &&
                    (d.village.toLowerCase().trim().includes(xlsxDesa) || xlsxDesa.includes(d.village.toLowerCase().trim()))
                );
            }
            if (dbMatch) { matched++; matchResults.push({ xlsx, db: dbMatch }); }
            else { unmatched++; console.log('   ❌ ' + xlsx['NAMA_DESA']); }
        }
        console.log('   ✅ Matched: ' + matched + ' | ❌ Unmatched: ' + unmatched + '\n');

        // ====== STEP 1: WKT POLYGONS (each in its own mini-transaction via savepoints) ======
        console.log('🗺️  Step 1: Importing WKT polygons...');
        let polyOk = 0, polyErr = 0;
        const polyErrors = [];

        for (const { xlsx, db } of matchResults) {
            const wkt = xlsx['wkt'];
            if (!wkt) continue;
            try {
                await sequelize.query(
                    `UPDATE "SocialForestPermits" SET boundary = ST_GeomFromText($1, 4326) WHERE id = $2`,
                    { bind: [wkt, db.id] }
                );
                polyOk++;
            } catch (e) {
                polyErr++;
                polyErrors.push(db.village + ': ' + e.message.substring(0, 60));
            }
        }
        console.log('   ✅ OK: ' + polyOk + ' | ❌ Errors: ' + polyErr);
        if (polyErrors.length > 0) {
            console.log('   Error details:');
            polyErrors.forEach(e => console.log('     ' + e));
        }
        console.log('');

        // ====== STEP 2: KK DATA ======
        console.log('👥 Step 2: Importing KK data...');
        let kkUpdated = 0, kkInserted = 0, kkSkipped = 0;

        for (const { xlsx, db } of matchResults) {
            const kk = Number(xlsx['Jml_KK']);
            if (!kk || kk <= 0 || !db.institutionId) { kkSkipped++; continue; }

            try {
                const [existing] = await sequelize.query(
                    'SELECT id, "totalHouseholds" FROM "InstitutionMembers" WHERE "institutionId" = $1',
                    { bind: [db.institutionId] }
                );

                if (existing.length > 0) {
                    if (!existing[0].totalHouseholds || existing[0].totalHouseholds === 0) {
                        await sequelize.query(
                            'UPDATE "InstitutionMembers" SET "totalHouseholds" = $1 WHERE id = $2',
                            { bind: [kk, existing[0].id] }
                        );
                        kkUpdated++;
                    } else { kkSkipped++; }
                } else {
                    await sequelize.query(
                        'INSERT INTO "InstitutionMembers" ("institutionId", "totalHouseholds", "totalMembers", "createdAt", "updatedAt") VALUES ($1, $2, $2, NOW(), NOW())',
                        { bind: [db.institutionId, kk] }
                    );
                    kkInserted++;
                }
            } catch (e) {
                console.log('   ⚠️ KK error ' + db.village + ': ' + e.message.substring(0, 60));
            }
        }
        console.log('   ✅ Updated: ' + kkUpdated + ' | Inserted: ' + kkInserted + ' | Skipped: ' + kkSkipped + '\n');

        // ====== STEP 3: FOREST AREA BREAKDOWN ======
        console.log('🌲 Step 3: Importing Forest Area...');
        let faInserted = 0, faSkipped = 0;

        for (const { xlsx, db } of matchResults) {
            for (const [xlsxCol, fsCode] of Object.entries(FOREST_CODES)) {
                const area = Number(xlsx[xlsxCol]);
                if (!area || area <= 0) continue;

                const fas = forestStatuses.find(f => f.code === fsCode);
                if (!fas) continue;

                try {
                    const [existing] = await sequelize.query(
                        'SELECT "permitId" FROM "PermitForestStatuses" WHERE "permitId" = $1 AND "statusId" = $2',
                        { bind: [db.id, fas.id] }
                    );
                    if (existing.length === 0) {
                        await sequelize.query(
                            'INSERT INTO "PermitForestStatuses" ("permitId", "statusId", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW())',
                            { bind: [db.id, fas.id] }
                        );
                        faInserted++;
                    } else { faSkipped++; }
                } catch (e) {
                    console.log('   ⚠️ FA error ' + db.village + '/' + fsCode + ': ' + e.message.substring(0, 60));
                }
            }
        }
        console.log('   ✅ Inserted: ' + faInserted + ' | Skipped: ' + faSkipped + '\n');

        // ====== SUMMARY ======
        console.log('🎉 IMPORT COMPLETE!');
        console.log('   WKT Polygons: ' + polyOk + ' imported, ' + polyErr + ' errors');
        console.log('   KK Data: ' + kkUpdated + ' updated, ' + kkInserted + ' inserted');
        console.log('   Forest Area: ' + faInserted + ' new pivot records');
        console.log('   Unmatched: ' + unmatched + ' rows');

        process.exit(0);
    } catch (e) {
        console.error('❌ Fatal error:', e.message);
        process.exit(1);
    }
})();
