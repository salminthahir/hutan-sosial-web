/**
 * Import script: Rawshp.json → Supabase Database & Local DB
 * Fixes the 18 failed WKT records and 6 unmatched records
 */

require('dotenv').config({ path: '.env' });
const fs = require('fs');
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

(async () => {
    try {
        // Load GeoJSON
        console.log('📂 Loading Rawshp.json...');
        const geojsonData = JSON.parse(fs.readFileSync('/Users/macbooksale/Work/Projects/hutan-sosial-go.id/rawdata/Rawshp.json', 'utf8'));
        const features = geojsonData.features;
        console.log('   Loaded ' + features.length + ' features\n');

        // Load DB permits to find those missing boundaries
        console.log('📊 Loading DB permits missing boundaries...');
        const [dbPermits] = await sequelize.query(`
      SELECT p.id, p."villageId", v.name as village
      FROM "SocialForestPermits" p
      LEFT JOIN "Villages" v ON p."villageId"=v.id
      WHERE p.boundary IS NULL
    `);
        console.log('   Missing boundaries in DB: ' + dbPermits.length + '\n');

        if (dbPermits.length === 0) {
            console.log('   All permits already have boundaries!');
            process.exit(0);
        }

        // Match GeoJSON to DB
        console.log('🔗 Matching & Importing...');
        let geoOk = 0, geoErr = 0;

        for (const db of dbPermits) {
            if (!db.village) continue;

            const dbDesaNormalized = db.village.toLowerCase().trim();

            // Find feature
            let feature = features.find(f => {
                const xDesa = normalizeDesa(f.properties.NAMA_DESA);
                return dbDesaNormalized === xDesa ||
                    dbDesaNormalized.includes(xDesa) ||
                    xDesa.includes(dbDesaNormalized);
            });

            if (feature && feature.geometry) {
                try {
                    // Use ST_GeomFromGeoJSON for safe geometry importing native from JSON
                    const geomStr = JSON.stringify(feature.geometry);
                    await sequelize.query(
                        `UPDATE "SocialForestPermits" SET boundary = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) WHERE id = $2`,
                        { bind: [geomStr, db.id] }
                    );
                    geoOk++;
                } catch (e) {
                    geoErr++;
                    console.log('   ⚠️ Error for ' + db.village + ': ' + e.message.substring(0, 60));
                }
            } else {
                console.log('   ❌ No feature found for: ' + db.village);
            }
        }

        console.log('\\n🎉 FIX COMPLETE!');
        console.log('   GeoJSON Imported: ' + geoOk);
        console.log('   Errors: ' + geoErr);

        process.exit(0);
    } catch (e) {
        console.error('❌ Fatal error:', e.message);
        process.exit(1);
    }
})();
