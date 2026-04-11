require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const config = require('../config/config.js')['development'];
const pg = require('pg');

const seq = new Sequelize(config.database, config.username, config.password, {
    ...config,
    dialectModule: pg
});

// Daftar 10 kabupaten/kota di Maluku Utara
const adminAccounts = [
    { regencyId: 11, name: 'Halmahera Barat',   username: 'admin.halbar',   email: 'admin.halbar@hutansosial.id' },
    { regencyId: 4,  name: 'Halmahera Utara',   username: 'admin.halut',    email: 'admin.halut@hutansosial.id' },
    { regencyId: 8,  name: 'Kepulauan Sula',    username: 'admin.sula',     email: 'admin.sula@hutansosial.id' },
    { regencyId: 5,  name: 'Halmahera Timur',   username: 'admin.haltim',   email: 'admin.haltim@hutansosial.id' },
    { regencyId: 7,  name: 'Halmahera Selatan',  username: 'admin.halsel',   email: 'admin.halsel@hutansosial.id' },
    { regencyId: 2,  name: 'Tidore Kepulauan',  username: 'admin.tikep',    email: 'admin.tikep@hutansosial.id' },
    { regencyId: 10, name: 'Pulau Morotai',     username: 'admin.morotai',  email: 'admin.morotai@hutansosial.id' },
    { regencyId: 6,  name: 'Halmahera Tengah',  username: 'admin.halteng',  email: 'admin.halteng@hutansosial.id' },
    { regencyId: 3,  name: 'Kota Ternate',      username: 'admin.ternate',  email: 'admin.ternate@hutansosial.id' },
    { regencyId: 9,  name: 'Pulau Taliabu',     username: 'admin.taliabu',  email: 'admin.taliabu@hutansosial.id' },
];

(async () => {
    try {
        console.log('Creating admin accounts for all kabupaten...\n');

        // Default password untuk semua admin kabupaten (harus diganti nanti)
        const defaultPassword = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(defaultPassword, salt);

        for (const account of adminAccounts) {
            // Check if already exists
            const [existing] = await seq.query(
                `SELECT id FROM "AdminUsers" WHERE username = $1 OR email = $2`,
                { bind: [account.username, account.email] }
            );

            if (existing.length > 0) {
                console.log(`  ⏭️  ${account.name} — sudah ada (skip)`);
                continue;
            }

            await seq.query(
                `INSERT INTO "AdminUsers" (username, email, "passwordHash", role, "regencyId", "isActive", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, 'admin', $4, true, NOW(), NOW())`,
                { bind: [account.username, account.email, passwordHash, account.regencyId] }
            );

            console.log(`  ✅ ${account.name} — ${account.username} (${account.email})`);
        }

        // Verify
        const [allAdmins] = await seq.query(
            `SELECT au.id, au.username, au.email, au.role, au."regencyId", r.name as regency_name
             FROM "AdminUsers" au
             LEFT JOIN "Regencies" r ON au."regencyId" = r.id
             ORDER BY au.id`
        );

        console.log('\n========================================');
        console.log('SEMUA AKUN ADMIN:');
        console.log('========================================');
        allAdmins.forEach(a => {
            const scope = a.regency_name || 'SEMUA KABUPATEN (superadmin)';
            console.log(`  [${a.id}] ${a.username} | ${a.email} | role: ${a.role} | wilayah: ${scope}`);
        });

        console.log('\n========================================');
        console.log(`Default password: ${defaultPassword}`);
        console.log('⚠️  SEGERA GANTI PASSWORD SETELAH LOGIN!');
        console.log('========================================');

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await seq.close();
    }
})();
