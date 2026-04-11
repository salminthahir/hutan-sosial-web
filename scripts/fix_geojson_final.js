/**
 * Fix remaining missing boundaries using Rawshp.json (GeoJSON source)
 * Uses ST_GeomFromGeoJSON which handles both Polygon and MultiPolygon natively
 * 
 * Usage:
 *   node scripts/fix_geojson_final.js local       (uses .env)
 *   node scripts/fix_geojson_final.js production   (uses .env.production)
 */

const target = process.argv[2] || 'local';
require('dotenv').config({ path: target === 'production' ? '.env.production' : '.env' });

const fs = require('fs');
const { Sequelize } = require('sequelize');
const pg = require('pg');

const isLocal = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', dialectModule: pg,
    dialectOptions: isLocal ? {} : { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

// Manual DB village → GeoJSON NAMA_DESA mapping
const MANUAL_MAP = {
    'dorari isa': 'dorariisa',
    'pocoa': 'pocao',
    'tolisaor': 'tolisaur',
    'worat-worat': 'worat worat',
    'waigay': 'wai gay',
    'tobololo': 'tabololo',
    'doriisa': 'dorariisa',
};

(async () => {
    try {
        console.log('🎯 Target: ' + target.toUpperCase() + ' (' + process.env.DB_HOST + ')');

        // Load GeoJSON
        const geojsonData = JSON.parse(fs.readFileSync(
            '/Users/macbooksale/Work/Projects/hutan-sosial-go.id/rawdata/Rawshp.json', 'utf8'
        ));
        const features = geojsonData.features;
        console.log('📂 Loaded ' + features.length + ' GeoJSON features');

        // Find permits still missing boundaries
        const [missing] = await sequelize.query(`
      SELECT p.id, v.name as village, i."fullName" as institution
      FROM "SocialForestPermits" p
      LEFT JOIN "Villages" v ON p."villageId" = v.id
      LEFT JOIN "Institutions" i ON p."institutionId" = i.id
      WHERE p.boundary IS NULL
      ORDER BY p.id
    `);
        console.log('📊 Missing boundaries: ' + missing.length + '\n');

        if (missing.length === 0) {
            console.log('✅ All permits already have boundaries!');
            process.exit(0);
        }

        let ok = 0, notFound = 0;

        for (const db of missing) {
            const dbVillage = (db.village || '').toLowerCase().trim();
            const mappedName = MANUAL_MAP[dbVillage] || dbVillage;

            // Strategy 1: exact match on normalized desa name
            let feature = features.find(f =>
                (f.properties.NAMA_DESA || '').toLowerCase().trim() === mappedName
            );

            // Strategy 2: partial contains
            if (!feature) {
                feature = features.find(f => {
                    const d = (f.properties.NAMA_DESA || '').toLowerCase().trim();
                    return d.includes(mappedName) || mappedName.includes(d);
                });
            }

            // Strategy 3: match via lembaga/institution name
            if (!feature && db.institution) {
                const instClean = db.institution
                    .replace(/^(LPHD|KTH|LD|KT|GAPOKTANHUT|GAPOKTAN)\.\s*/i, '')
                    .toLowerCase().trim();
                feature = features.find(f => {
                    const l = (f.properties.LEMBAGA || '').toLowerCase();
                    return l.includes(instClean) || instClean.includes(l.replace(/^(lphd|kth|ld|kt)\s+/i, '').trim());
                });
            }

            if (feature && feature.geometry) {
                try {
                    const geomStr = JSON.stringify(feature.geometry);
                    await sequelize.query(
                        `UPDATE "SocialForestPermits" SET boundary = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) WHERE id = $2`,
                        { bind: [geomStr, db.id] }
                    );
                    ok++;
                    console.log('  ✅ ' + db.village + ' → ' + feature.properties.NAMA_DESA);
                } catch (e) {
                    console.log('  ⚠️ Error ' + db.village + ': ' + e.message.substring(0, 60));
                }
            } else {
                notFound++;
                console.log('  ❌ Not found: ' + db.village + ' (' + (db.institution || 'no inst') + ')');
            }
        }

        // Final count
        const [remaining] = await sequelize.query(
            'SELECT count(*) as cnt FROM "SocialForestPermits" WHERE boundary IS NULL'
        );

        console.log('\n🎉 DONE!');
        console.log('   Fixed: ' + ok);
        console.log('   Not found in GeoJSON: ' + notFound);
        console.log('   Total still missing: ' + remaining[0].cnt);

        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
