const fs = require('fs');
const db = require('../models');

function parseCSV(filepath) {
    const raw = fs.readFileSync(filepath, 'utf-8');
    const lines = raw.split(/\r?\n/).filter(l => l.trim() && !l.match(/^;+$/));

    const dataRows = [];
    for (let i = 2; i < lines.length; i++) {
        const cols = lines[i].split(';');
        const no = cols[0]?.trim();
        if (!no || isNaN(parseInt(no))) continue;

        dataRows.push({
            no: parseInt(no),
            pdf: cols[2]?.trim() === 'OK',
            fisik: cols[1]?.trim() === 'OK',
            serahTerima: cols[3]?.trim() === 'OK',
            namaLengkap: cols[11]?.trim() || '',
            desa: cols[14]?.trim() || ''
        });
    }
    return dataRows;
}

// Function to clean and standardize names for matching
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/^(hutan desa|hutan kemasyarakatan|hutan tanaman rakyat|hutan adat|kemitraan kehutanan|izin pemanfaatan hutan perhutanan sosial)\s+/i, '')
        .replace(/\s+(ld|kth|lphd|koperasi|poktan|gapoktanhut|gapoktan|kt|lpmd)$/i, '')
        .replace(/^(lphd|ld|kth|koperasi|poktan|gapoktanhut|gapoktan|kt)\.\s*/i, '')
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function updatePdfFlags() {
    const t = await db.sequelize.transaction();
    try {
        const csvPath = '/Users/macbooksale/Work/Projects/hutan-sosial-go.id/CSV/Daftar SK Izin PS Maluku Utara update 2025.csv';
        const csvRows = parseCSV(csvPath);
        console.log(`Parsed ${csvRows.length} CSV rows.`);

        const permits = await db.SocialForestPermits.findAll({
            include: [
                { model: db.Institutions, as: 'institution' }
            ],
            transaction: t
        });

        let updatedCount = 0;
        let missing = [];

        for (const permit of permits) {
            const dbName = permit.institution?.fullName || permit.institution?.shortName || '';
            const dbClean = normalizeName(dbName);

            // Special explicit mappings for the 11 edge cases identified earlier
            let csvMatch = null;

            if (dbClean === 'ngele-ngele kecil') csvMatch = csvRows.find(r => r.namaLengkap.includes('Ngele-Ngele'));
            else if (dbClean === 'nurul simal') csvMatch = csvRows.find(r => r.namaLengkap.includes('Nurul Simal'));
            else if (dbClean === 'satu hati') csvMatch = csvRows.find(r => r.namaLengkap.includes('Satu Hati'));
            else if (dbClean === 'akesahu gamsungi') csvMatch = csvRows.find(r => r.namaLengkap.includes('Akesahu'));
            else if (dbClean === 'sagela yef') csvMatch = csvRows.find(r => r.namaLengkap.includes('Sigela Yef'));
            else if (dbClean === 'togoreba sungi') csvMatch = csvRows.find(r => r.namaLengkap.includes('Togereba Sungi'));
            else if (dbClean === 'kupa kupa horimoi') csvMatch = csvRows.find(r => r.namaLengkap.includes('Kupa Kupa Horimaoi'));
            else if (dbClean === 'pocao') csvMatch = csvRows.find(r => r.namaLengkap.includes('Pocoa'));
            else if (dbClean === 'perkebunan bacan lippu mandiri') csvMatch = csvRows.find(r => r.namaLengkap.includes('Perkebunan Bacan Lippu Mandiri'));
            else if (dbClean === 'ake membangun') csvMatch = csvRows.find(r => r.namaLengkap.includes('Ake Mambangun'));
            else if (dbClean === 'lingga amo') csvMatch = csvRows.find(r => r.namaLengkap.includes('Lingga Lamo'));

            // General matching
            if (!csvMatch) {
                csvMatch = csvRows.find(r => normalizeName(r.namaLengkap) === dbClean);
            }

            // Try matching by the exact raw name string just in case
            if (!csvMatch) {
                csvMatch = csvRows.find(r => r.namaLengkap.toLowerCase().replace(/\s+/g, ' ') === dbName.toLowerCase().replace(/\s+/g, ' '));
            }

            if (csvMatch) {
                // Update flags
                await permit.update({
                    hasPdfDoc: csvMatch.pdf,
                    hasPhysicalDoc: csvMatch.fisik,
                    hasHandover: csvMatch.serahTerima
                }, { transaction: t });
                updatedCount++;
            } else {
                missing.push(dbName);
            }
        }

        await t.commit();
        console.log(`✅ Successfully updated PDF flags for ${updatedCount} permits.`);
        if (missing.length > 0) {
            console.log(`❌ Could not match ${missing.length} DB records to CSV data:`);
            console.log(missing.join(', '));
        }

    } catch (error) {
        await t.rollback();
        console.error('Transaction failed:', error);
    }
    process.exit(0);
}

updatePdfFlags();
