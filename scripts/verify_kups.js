// Verify KUPS data in database after import
const { Sequelize } = require('sequelize');
const pg = require('pg');

const sequelize = new Sequelize('hutan_kita_db', 'hutan_kita_user', 'hutan_kita_password', {
    host: '127.0.0.1', port: 5432, dialect: 'postgres', logging: false, dialectModule: pg
});

async function verify() {
    await sequelize.authenticate();
    
    // 1. Summary
    const [summary] = await sequelize.query(`
        SELECT 
            COUNT(*) as total_kups,
            COUNT("permitId") as linked_to_permit,
            COUNT(*) - COUNT("permitId") as no_permit,
            COUNT("establishedYear") as has_year,
            COUNT("skNumber") as has_sk_kups,
            COUNT("businessType") as has_business_type,
            COUNT("cluster") as has_cluster,
            COUNT("phoneNumber") as has_phone,
            COUNT("goldUpgradeYear") as has_gold_year,
            COUNT("address") as has_address
        FROM "KUPS"
    `);
    console.log('=== KUPS DATABASE SUMMARY ===');
    console.log(JSON.stringify(summary[0], null, 2));

    // 2. Per Business Class
    const [byClass] = await sequelize.query(`
        SELECT "businessClass", COUNT(*) as count 
        FROM "KUPS" 
        GROUP BY "businessClass" 
        ORDER BY count DESC
    `);
    console.log('\n--- Per Kelas KUPS ---');
    byClass.forEach(r => console.log(`  ${r.businessClass}: ${r.count}`));

    // 3. Per Cluster
    const [byCluster] = await sequelize.query(`
        SELECT "cluster", COUNT(*) as count 
        FROM "KUPS" 
        WHERE "cluster" IS NOT NULL AND "cluster" != '' AND "cluster" != '-'
        GROUP BY "cluster" 
        ORDER BY count DESC
        LIMIT 15
    `);
    console.log('\n--- Per Klaster (Top 15) ---');
    byCluster.forEach(r => console.log(`  ${r.cluster}: ${r.count}`));

    // 4. Per Year established
    const [byYear] = await sequelize.query(`
        SELECT "establishedYear", COUNT(*) as count 
        FROM "KUPS" 
        WHERE "establishedYear" IS NOT NULL
        GROUP BY "establishedYear" 
        ORDER BY "establishedYear"
    `);
    console.log('\n--- Per Tahun Pembentukan ---');
    byYear.forEach(r => console.log(`  ${r.establishedYear}: ${r.count}`));

    // 5. KUPS per permit (how many permits have KUPS?)
    const [permitStats] = await sequelize.query(`
        SELECT 
            COUNT(DISTINCT "permitId") as permits_with_kups,
            (SELECT COUNT(*) FROM "SocialForestPermits") as total_permits
        FROM "KUPS" 
        WHERE "permitId" IS NOT NULL
    `);
    console.log('\n--- Permit Coverage ---');
    console.log(`  Permits with KUPS: ${permitStats[0].permits_with_kups} / ${permitStats[0].total_permits}`);

    // 6. KUPS count distribution per permit
    const [kupsPerPermit] = await sequelize.query(`
        SELECT kups_count, COUNT(*) as permits
        FROM (
            SELECT "permitId", COUNT(*) as kups_count 
            FROM "KUPS" 
            WHERE "permitId" IS NOT NULL
            GROUP BY "permitId"
        ) sub
        GROUP BY kups_count
        ORDER BY kups_count
    `);
    console.log('\n--- KUPS per Permit Distribution ---');
    kupsPerPermit.forEach(r => console.log(`  ${r.kups_count} KUPS → ${r.permits} permits`));

    // 7. Sample 5 records showing all fields
    const [samples] = await sequelize.query(`
        SELECT k.*, 
               i."shortName" as institution_name,
               p."permitNumber"
        FROM "KUPS" k
        LEFT JOIN "SocialForestPermits" p ON k."permitId" = p.id
        LEFT JOIN "Institutions" i ON p."institutionId" = i.id
        WHERE k."cluster" IS NOT NULL 
          AND k."phoneNumber" IS NOT NULL
          AND k."skNumber" IS NOT NULL
        LIMIT 5
    `);
    console.log('\n=== SAMPLE 5 COMPLETE RECORDS ===');
    samples.forEach((s, i) => {
        console.log(`\n--- KUPS #${i+1}: "${s.name}" ---`);
        console.log(`  Ketua: ${s.chairmanName}`);
        console.log(`  Tahun: ${s.establishedYear}`);
        console.log(`  Kelas: ${s.businessClass}`);
        console.log(`  Klaster: ${s.cluster}`);
        console.log(`  Komoditas: ${s.commodities}`);
        console.log(`  Jenis Usaha: ${s.businessType}`);
        console.log(`  SK KUPS: ${s.skNumber}`);
        console.log(`  HP: ${s.phoneNumber}`);
        console.log(`  Alamat: ${s.address}`);
        console.log(`  Tahun Gold: ${s.goldUpgradeYear || '-'}`);
        console.log(`  → Permit: ${s.institution_name} (${s.permitNumber})`);
    });

    // 8. Gold class KUPS
    const [goldKups] = await sequelize.query(`
        SELECT k."name", k."chairmanName", k."goldUpgradeYear", k."cluster", k."commodities",
               i."shortName" as institution
        FROM "KUPS" k
        LEFT JOIN "SocialForestPermits" p ON k."permitId" = p.id
        LEFT JOIN "Institutions" i ON p."institutionId" = i.id
        WHERE k."businessClass" IN ('Gold', 'Platinum')
        ORDER BY k."businessClass" DESC, k."goldUpgradeYear" DESC NULLS LAST
    `);
    console.log(`\n=== GOLD & PLATINUM KUPS (${goldKups.length}) ===`);
    goldKups.forEach((g, i) => {
        console.log(`  ${i+1}. [${g.businessClass || 'Gold'}] "${g.name}" — ${g.institution || 'N/A'} | Klaster: ${g.cluster || '-'} | Tahun Gold: ${g.goldUpgradeYear || '-'}`);
    });

    await sequelize.close();
}

verify().catch(err => { console.error(err); process.exit(1); });
