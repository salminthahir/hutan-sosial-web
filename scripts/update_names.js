const { sequelize, Institutions, SocialForestPermits, PSSchemes } = require('../models');

const schemeFullNames = {
    'HD': 'Hutan Desa',
    'HKm': 'Hutan Kemasyarakatan',
    'HTR': 'Hutan Tanaman Rakyat',
    'HA': 'Hutan Adat',
    'Kulin KK': 'Kemitraan Kehutanan',
    'IPHPS': 'Izin Pemanfaatan Hutan Perhutanan Sosial',
    'Kemitraan Konservasi': 'Kemitraan Konservasi'
};

const prefixes = [
    'LD.', 'LD',
    'Koperasi.', 'Koperasi',
    'KTH.', 'KTH',
    'Poktan.', 'Poktan',
    'Gapoktanhut.', 'Gapoktanhut',
    'Gapoktan.', 'Gapoktan',
    'LPHD.', 'LPHD',
    'LPMD.', 'LPMD'
];

async function updateNames() {
    const t = await sequelize.transaction();
    try {
        const permits = await SocialForestPermits.findAll({
            include: [
                { model: Institutions, as: 'institution' },
                { model: PSSchemes, as: 'scheme' }
            ],
            transaction: t
        });

        console.log(`Found ${permits.length} permits.`);
        let updatedCount = 0;

        for (const p of permits) {
            const inst = p.institution;
            if (!inst) continue;

            const oldName = inst.fullName || inst.shortName;
            if (!oldName) continue;

            const schemeCode = p.scheme?.code || '';
            const schemeName = schemeFullNames[schemeCode] || schemeCode || '';

            let coreName = oldName.trim();
            let currentPrefix = '';

            // 1. Remove Prefix
            for (const prefix of prefixes) {
                // match prefix at the start, ignoring case
                const escapedPrefix = prefix.replace('.', '\\.');
                const prefixRegex = new RegExp(`^${escapedPrefix}\\s*`, 'i');
                if (prefixRegex.test(coreName)) {
                    currentPrefix = prefix.replace('.', ''); // Clean prefix for display, e.g. "LD"
                    coreName = coreName.replace(prefixRegex, '').trim();
                    break;
                }
            }

            // 2. Remove Scheme Suffix if present
            if (schemeCode) {
                const escapedCode = schemeCode.replace('.', '\\.');
                const suffixRegex = new RegExp(`[\\s\\.-]+${escapedCode}\\.?$`, 'i');
                if (suffixRegex.test(coreName)) {
                    coreName = coreName.replace(suffixRegex, '').trim();
                }
            }

            // Clean up any double dots or trailing dots
            coreName = coreName.replace(/^[.-]+|[.-]+$/g, '').trim();

            // 3. Construct new name
            let newName = '';
            if (schemeName) newName += `${schemeName} `;
            newName += coreName;
            if (currentPrefix) newName += ` ${currentPrefix}`;

            newName = newName.replace(/\s+/g, ' ').trim();

            if (oldName !== newName) {
                console.log(`Updated: ${oldName.padEnd(40)} -> ${newName}`);
                await inst.update({
                    fullName: newName,
                    shortName: newName
                }, { transaction: t });
                updatedCount++;
            }
        }

        await t.commit();
        console.log(`✅ Update complete! Renamed ${updatedCount} institutions.`);

    } catch (e) {
        await t.rollback();
        console.error('❌ Failed:', e);
    }
    process.exit(0);
}

// Ensure array is sorted by length descending so longer prefixes match first (e.g. 'LD.' before 'LD')
prefixes.sort((a, b) => b.length - a.length);

updateNames();
