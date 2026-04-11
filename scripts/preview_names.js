const { sequelize, Institutions, SocialForestPermits, PSSchemes } = require('../models');

async function previewNames() {
    try {
        const permits = await SocialForestPermits.findAll({
            include: [
                { model: Institutions, as: 'institution' },
                { model: PSSchemes, as: 'scheme' }
            ]
        });

        console.log(`Found ${permits.length} permits.`);

        for (let i = 0; i < Math.min(20, permits.length); i++) {
            const p = permits[i];
            const oldName = p.institution?.fullName || p.institution?.shortName;
            const schemeName = p.scheme?.name || '';
            const schemeCode = p.scheme?.code || '';

            let coreName = oldName;
            let currentPrefix = '';

            // Extract prefix
            const prefixes = ['LD.', 'Koperasi', 'KTH', 'Poktan', 'Gapoktanhut', 'Gapoktan', 'LPHD', 'LPMD'];
            for (const prefix of prefixes) {
                // regex to match prefix at the start, case insensitive, with optional dot/space
                const regex = new RegExp(`^${prefix.replace('.', '\\.')}\\s*`, 'i');
                if (regex.test(coreName)) {
                    currentPrefix = prefix.replace('.', ''); // Remove dot for display, e.g. "LD"
                    coreName = coreName.replace(regex, '');
                    break;
                }
            }

            // Extract suffix if it matches the scheme name or code (like "HD")
            if (schemeCode) {
                const suffixRegex = new RegExp(`\\s*\\.?\\s*${schemeCode}\\.?$`, 'i');
                if (suffixRegex.test(coreName)) {
                    coreName = coreName.replace(suffixRegex, '');
                }
            }

            const newName = `${schemeName} ${coreName.trim()} ${currentPrefix}`.trim().replace(/\s+/g, ' ');
            console.log(`Old: ${oldName.padEnd(40)} | New: ${newName}`);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

previewNames();
