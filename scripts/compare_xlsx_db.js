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

        // Check KK in database
        const [dbKK] = await sequelize.query(`
      SELECT im."totalHouseholds", im."totalMembers", 
             i."fullName" as inst_name, p."permitNumber"
      FROM "InstitutionMembers" im
      JOIN "Institutions" i ON im."institutionId" = i.id
      LEFT JOIN "SocialForestPermits" p ON p."institutionId" = i.id
      WHERE im."totalHouseholds" IS NOT NULL AND im."totalHouseholds" > 0
      LIMIT 10
    `);
        console.log('=== DB: InstitutionMembers with totalHouseholds > 0 ===');
        console.log('Found:', dbKK.length);
        dbKK.forEach(r => console.log('  ' + r.inst_name + ': ' + r.totalHouseholds + ' KK, ' + r.totalMembers + ' members'));

        const [dbKKTotal] = await sequelize.query(`
      SELECT count(*) as total,
             count(CASE WHEN im."totalHouseholds" > 0 THEN 1 END) as with_kk,
             count(CASE WHEN im."totalHouseholds" IS NULL OR im."totalHouseholds" = 0 THEN 1 END) as without_kk,
             COALESCE(sum(im."totalHouseholds"), 0) as total_kk
      FROM "InstitutionMembers" im
    `);
        console.log('\n=== DB: KK Summary ===');
        console.log(JSON.stringify(dbKKTotal[0], null, 2));

        // Check permits that exist in DB but not in XLSX and vice versa
        const [dbPermits] = await sequelize.query(`
      SELECT p.id, p."permitNumber", v.name as village, d.name as district, r.name as regency,
             i."fullName" as institution,
             CASE WHEN p.boundary IS NOT NULL THEN 'YES' ELSE 'NO' END as has_boundary,
             CASE WHEN p.location IS NOT NULL THEN 'YES' ELSE 'NO' END as has_location,
             p."areaPermitted"
      FROM "SocialForestPermits" p
      LEFT JOIN "Villages" v ON p."villageId"=v.id
      LEFT JOIN "Districts" d ON v."districtId"=d.id
      LEFT JOIN "Regencies" r ON d."regencyId"=r.id
      LEFT JOIN "Institutions" i ON p."institutionId"=i.id
      ORDER BY p.id
    `);

        // Match by village name + institution name
        console.log('\n=== MATCHING: XLSX ↔ DB ===');
        let matched = 0, xlsxOnly = 0, dbOnly = 0;
        const xlsxSet = new Set();
        xlsxData.forEach(x => {
            const key = (x['NAMA_DESA'] + '|' + x['LEMBAGA']).toLowerCase();
            xlsxSet.add(key);
            const dbMatch = dbPermits.find(d =>
                d.village && d.institution &&
                d.village.toLowerCase() === (x['NAMA_DESA'] || '').toLowerCase() &&
                d.institution.toLowerCase() === (x['LEMBAGA'] || '').toLowerCase()
            );
            if (dbMatch) matched++;
            else xlsxOnly++;
        });

        const dbSet = new Set();
        dbPermits.forEach(d => {
            const key = ((d.village || '') + '|' + (d.institution || '')).toLowerCase();
            dbSet.add(key);
            if (!xlsxSet.has(key)) dbOnly++;
        });

        console.log('  Matched (in both): ' + matched);
        console.log('  In XLSX only: ' + xlsxOnly);
        console.log('  In DB only: ' + dbOnly);

        // Show some DB-only entries
        if (dbOnly > 0) {
            console.log('\n  DB-only permits (first 10):');
            let cnt = 0;
            dbPermits.forEach(d => {
                const key = ((d.village || '') + '|' + (d.institution || '')).toLowerCase();
                if (!xlsxSet.has(key) && cnt < 10) {
                    console.log('    ID:' + d.id + ' | ' + d.village + ' | ' + d.institution + ' | SK:' + (d.permitNumber || '').substring(0, 50));
                    cnt++;
                }
            });
        }

        // Show XLSX-only entries
        if (xlsxOnly > 0) {
            console.log('\n  XLSX-only entries (first 10):');
            let cnt2 = 0;
            xlsxData.forEach(x => {
                const dbMatch = dbPermits.find(d =>
                    d.village && d.institution &&
                    d.village.toLowerCase() === (x['NAMA_DESA'] || '').toLowerCase() &&
                    d.institution.toLowerCase() === (x['LEMBAGA'] || '').toLowerCase()
                );
                if (!dbMatch && cnt2 < 10) {
                    console.log('    DESA: ' + x['NAMA_DESA'] + ' | LEMBAGA: ' + x['LEMBAGA'] + ' | SK: ' + String(x['NO_SK'] || '').substring(0, 50));
                    cnt2++;
                }
            });
        }

        // Check NAMA_KAB differences  
        console.log('\n=== NAMA_KAB Differences ===');
        const xlsxKab = new Set(xlsxData.map(x => x['NAMA_KAB']));
        const [dbKab] = await sequelize.query('SELECT DISTINCT name FROM "Regencies" ORDER BY name');
        const dbKabSet = new Set(dbKab.map(k => k.name));
        console.log('XLSX kabupaten:', [...xlsxKab].sort().join(', '));
        console.log('DB kabupaten:', [...dbKabSet].sort().join(', '));

        process.exit(0);
    } catch (e) { console.error('Error:', e.message); process.exit(1); }
})();
