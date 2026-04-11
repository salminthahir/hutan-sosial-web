const XLSX = require('xlsx');
const db = require('../models');

// Reuse name normalizer for matching
function normalizeName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/^(hutan desa|hutan kemasyarakatan|hutan tanaman rakyat|hutan adat|kemitraan kehutanan|izin pemanfaatan hutan perhutanan sosial)\s+/i, '')
        .replace(/\s+(ld|kth|lphd|koperasi|poktan|gapoktanhut|gapoktan|kt|lpmd)$/i, '')
        .replace(/^(lphd|ld|kth|koperasi|poktan|gapoktanhut|gapoktan|kt)\.\s*/i, '')
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function importKups() {
    const t = await db.sequelize.transaction();
    try {
        const filePath = '/Users/macbooksale/Work/Projects/hutan-sosial-go.id/Rekapitulasi Persetujuan PS Malut.xlsx';
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['KPS'];
        const range = XLSX.utils.decode_range(sheet['!ref']);

        const permits = await db.SocialForestPermits.findAll({
            include: [{ model: db.Institutions, as: 'institution' }],
            transaction: t
        });

        const colNames = ['NamaKUPS', 'Ketua', 'Anggota', 'Komoditas', 'KapUsaha', 'NIB', 'AksesModal', 'Kelas'];
        let kupsData = [];
        let validPermitsFound = 0;
        let missing = [];

        let currentPermitMatch = null;

        // In sheet 'KPS', rows start data at index R=3 (row 4 in excel format technically, using 0-index here)
        for (let R = 3; R <= range.e.r; R++) {
            let row = {};
            for (let i = 0; i < colNames.length; i++) {
                const C = 55 + i;
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                const cell = sheet[cellRef];
                row[colNames[i]] = cell ? String(cell.v).trim() : null;
            }

            // check if there is KuPS data 
            if (row.NamaKUPS && row.NamaKUPS !== '-') {
                // Get the institution name (col index 2) to search the DB
                const nameRef = XLSX.utils.encode_cell({ c: 2, r: R });
                const nameCell = sheet[nameRef];
                const instName = nameCell ? String(nameCell.v).trim() : '';

                if (instName) {
                    const dbClean = normalizeName(instName);

                    let permitMatch = null;
                    // Custom fallback matches based on earlier import scripts
                    const findMatch = (pattern) => permits.find(p => (p.institution?.fullName || p.institution?.shortName || '').includes(pattern));

                    if (dbClean === 'ngele-ngele kecil') permitMatch = findMatch('Ngele-Ngele');
                    else if (dbClean === 'nurul simal') permitMatch = findMatch('Nurul Simal');
                    else if (dbClean === 'satu hati') permitMatch = findMatch('Satu Hati');
                    else if (dbClean === 'akesahu gamsungi') permitMatch = findMatch('Akesahu');
                    else if (dbClean === 'sagela yef') permitMatch = findMatch('Sigela Yef');
                    else if (dbClean === 'togoreba sungi') permitMatch = findMatch('Togereba Sungi');
                    else if (dbClean === 'kupa kupa horimoi') permitMatch = findMatch('Kupa Kupa Horimaoi');
                    else if (dbClean === 'pocao') permitMatch = findMatch('Pocoa');
                    else if (dbClean === 'perkebunan bacan lippu mandiri') permitMatch = findMatch('Perkebunan Bacan Lippu Mandiri');
                    else if (dbClean === 'ake membangun') permitMatch = findMatch('Ake Mambangun');
                    else if (dbClean === 'lingga amo') permitMatch = findMatch('Lingga Lamo');

                    if (!permitMatch) {
                        permitMatch = permits.find(p => normalizeName(p.institution?.fullName || p.institution?.shortName || '') === dbClean);
                    }
                    if (!permitMatch) {
                        permitMatch = permits.find(p => (p.institution?.fullName || p.institution?.shortName || '').toLowerCase().replace(/\s+/g, ' ') === instName.toLowerCase().replace(/\s+/g, ' '));
                    }

                    currentPermitMatch = permitMatch;

                    if (!permitMatch) {
                        missing.push(instName);
                    }
                }

                if (currentPermitMatch) {
                    validPermitsFound++;
                    kupsData.push({
                        name: row.NamaKUPS,
                        chairmanName: row.Ketua !== '-' ? row.Ketua : null,
                        totalMembers: row.Anggota !== '-' ? row.Anggota : null,
                        commodities: row.Komoditas !== '-' ? row.Komoditas : null,
                        businessClass: row.Kelas !== '-' ? row.Kelas : null,
                        permitId: currentPermitMatch.id
                    });
                }
            }
        }

        console.log(`Found ${kupsData.length} valid KUPS records belonging to ${validPermitsFound} permits.`);

        // Clear all KUPS Data first to recreate
        await db.KUPS.destroy({ where: {}, transaction: t });

        // Bulk Insert
        await db.KUPS.bulkCreate(kupsData, { transaction: t });

        await t.commit();
        console.log(`✅ Successfully saved ${kupsData.length} KUPS Profiles.`);
        // console.log(`Unmatched institutions with KUPS:`, [...new Set(missing)]);

    } catch (error) {
        await t.rollback();
        console.error('Migration failed:', error);
    }
    process.exit(0);
}

importKups();
