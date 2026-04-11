require('dotenv').config({ path: '.env.production' });
const XLSX = require('xlsx');
const { Sequelize } = require('sequelize');
const pg = require('pg');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', dialectModule: pg,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }, logging: false
});

(async () => {
    try {
        // Load XLSX
        const wb = XLSX.readFile('/Users/macbooksale/Work/Projects/hutan-sosial-go.id/rawdata/untitled.xlsx');
        const allData = XLSX.utils.sheet_to_json(wb.Sheets['untitled'], { defval: null });
        const headers = Object.values(allData[0]);
        const xlsxData = allData.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = row['Column' + (i + 1)]; });
            return obj;
        });

        // Load DB permits with KK data
        const [dbPermits] = await sequelize.query(`
      SELECT p.id, p."permitNumber", p."areaPermitted",
             v.name as village, d.name as district, r.name as regency,
             i."fullName" as institution,
             im."totalHouseholds" as db_kk, im."totalMembers" as db_members,
             CASE WHEN p.boundary IS NOT NULL THEN 'YES' ELSE 'NO' END as has_boundary
      FROM "SocialForestPermits" p
      LEFT JOIN "Villages" v ON p."villageId"=v.id
      LEFT JOIN "Districts" d ON v."districtId"=d.id
      LEFT JOIN "Regencies" r ON d."regencyId"=r.id
      LEFT JOIN "Institutions" i ON p."institutionId"=i.id
      LEFT JOIN "InstitutionMembers" im ON im."institutionId"=i.id
      ORDER BY p.id
    `);

        // =============================================
        // STRATEGY 1: Match by DESA name (case-insensitive)
        // =============================================
        console.log('=== STRATEGY 1: Match by NAMA_DESA (case-insensitive) ===');
        let matchDesa = 0, unmatchDesa = 0;
        const desaMatches = [];
        xlsxData.forEach(x => {
            const xDesa = (x['NAMA_DESA'] || '').toLowerCase().trim();
            const match = dbPermits.find(d => d.village && d.village.toLowerCase().trim() === xDesa);
            if (match) {
                matchDesa++;
                desaMatches.push({ xlsx: x, db: match });
            } else {
                unmatchDesa++;
            }
        });
        console.log('  Matched: ' + matchDesa + ' / ' + xlsxData.length);
        console.log('  Unmatched XLSX: ' + unmatchDesa);

        // Show unmatched
        if (unmatchDesa > 0) {
            console.log('  Unmatched XLSX desa:');
            xlsxData.forEach(x => {
                const xDesa = (x['NAMA_DESA'] || '').toLowerCase().trim();
                const match = dbPermits.find(d => d.village && d.village.toLowerCase().trim() === xDesa);
                if (!match) {
                    console.log('    ' + x['NAMA_DESA'] + ' | ' + x['LEMBAGA'] + ' | ' + x['NO_SK']);
                }
            });
        }

        // =============================================
        // STRATEGY 2: Match by DESA + partial SK
        // =============================================
        console.log('\n=== STRATEGY 2: Match by NAMA_DESA + SK contains ===');
        let matchDesaSK = 0;
        xlsxData.forEach(x => {
            const xDesa = (x['NAMA_DESA'] || '').toLowerCase().trim();
            const xSK = (x['NO_SK'] || '').toLowerCase().replace(/\s+/g, '');
            const match = dbPermits.find(d => {
                if (!d.village) return false;
                const dDesa = d.village.toLowerCase().trim();
                const dSK = (d.permitNumber || '').toLowerCase().replace(/\s+/g, '');
                // Match by desa name AND SK number contains some common substring
                const skMatch = xSK.length > 10 && dSK.length > 10 &&
                    (dSK.includes(xSK.substring(3, 15)) || xSK.includes(dSK.substring(3, 15)));
                return dDesa === xDesa || skMatch;
            });
            if (match) matchDesaSK++;
        });
        console.log('  Matched: ' + matchDesaSK + ' / ' + xlsxData.length);

        // =============================================
        // KK COMPARISON per matched desa
        // =============================================
        console.log('\n=== KK COMPARISON (per desa match) ===');
        let kkSame = 0, kkDiff = 0, kkXlsxOnly = 0, kkDbOnly = 0, kkBothZero = 0;
        const diffs = [];
        desaMatches.forEach(({ xlsx, db }) => {
            const xlsxKK = Number(xlsx['Jml_KK']) || 0;
            const dbKK = Number(db.db_kk) || 0;

            if (xlsxKK === dbKK) {
                if (xlsxKK === 0) kkBothZero++;
                else kkSame++;
            } else if (xlsxKK > 0 && dbKK === 0) {
                kkXlsxOnly++;
                diffs.push({ desa: xlsx['NAMA_DESA'], xlsxKK, dbKK, type: 'XLSX_ONLY' });
            } else if (xlsxKK === 0 && dbKK > 0) {
                kkDbOnly++;
                diffs.push({ desa: xlsx['NAMA_DESA'], xlsxKK, dbKK, type: 'DB_ONLY' });
            } else {
                kkDiff++;
                diffs.push({ desa: xlsx['NAMA_DESA'], xlsxKK, dbKK, type: 'DIFFERENT' });
            }
        });

        console.log('  KK sama (>0): ' + kkSame);
        console.log('  KK berbeda (keduanya >0): ' + kkDiff);
        console.log('  KK hanya di XLSX: ' + kkXlsxOnly);
        console.log('  KK hanya di DB: ' + kkDbOnly);
        console.log('  Keduanya 0: ' + kkBothZero);

        // Show all rows where KK differs
        console.log('\n  --- Rows where KK DIFFERS (both > 0) ---');
        diffs.filter(d => d.type === 'DIFFERENT').forEach(d => {
            console.log('    ' + d.desa + ': XLSX=' + d.xlsxKK + ' vs DB=' + d.dbKK + ' (diff: ' + (d.xlsxKK - d.dbKK) + ')');
        });

        console.log('\n  --- Rows where KK only in XLSX (DB = 0) ---');
        diffs.filter(d => d.type === 'XLSX_ONLY').slice(0, 15).forEach(d => {
            console.log('    ' + d.desa + ': XLSX=' + d.xlsxKK + ' | DB=0');
        });
        const xlsxOnlyMore = diffs.filter(d => d.type === 'XLSX_ONLY').length - 15;
        if (xlsxOnlyMore > 0) console.log('    ... and ' + xlsxOnlyMore + ' more');

        console.log('\n  --- Rows where KK only in DB (XLSX = 0) ---');
        diffs.filter(d => d.type === 'DB_ONLY').slice(0, 15).forEach(d => {
            console.log('    ' + d.desa + ': DB=' + d.dbKK + ' | XLSX=0');
        });

        process.exit(0);
    } catch (e) { console.error('Error:', e.message); process.exit(1); }
})();
