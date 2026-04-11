const XLSX = require('xlsx');
const db = require('../models');

// Borrowing normalizer from the previous CSV import script
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

async function extractExcelLinks() {
    const t = await db.sequelize.transaction();
    try {
        const filePath = '/Users/macbooksale/Work/Projects/hutan-sosial-go.id/CSV/Daftar SK Izin PS Maluku Utara update 2025.xlsx';
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // The data rows start at row 3 (which is index 2 in 0-based indexing if parsing to JSON, 
        // but for cell keys it is row 3 in Excel nomenclature)
        // Let's get the range
        const range = XLSX.utils.decode_range(sheet['!ref']);

        let linkData = [];

        // Assuming:
        // C = PDF, D = Serah Terima ... L = Nama Lengkap ... U = Nomor Izin
        for (let R = 2; R <= range.e.r; ++R) {
            // Find Nama Lengkap Lembaga (column L, index 11)
            const nameCellAddress = { c: 11, r: R };
            const nameCellRef = XLSX.utils.encode_cell(nameCellAddress);
            const nameCell = sheet[nameCellRef];
            const nameVal = nameCell ? nameCell.v : '';

            // Find PDF (column C, index 2)
            const pdfCellAddress = { c: 2, r: R };
            const pdfCellRef = XLSX.utils.encode_cell(pdfCellAddress);
            const pdfCell = sheet[pdfCellRef];

            let url = null;
            if (pdfCell && pdfCell.l && pdfCell.l.Target) {
                url = pdfCell.l.Target;
            }

            if (nameVal && nameVal.trim()) {
                linkData.push({
                    name: nameVal.trim(),
                    url: url
                });
            }
        }

        console.log(`Extracted metadata for ${linkData.length} records. Found ${linkData.filter(d => d.url).length} URLs.`);

        const permits = await db.SocialForestPermits.findAll({
            include: [{ model: db.Institutions, as: 'institution' }],
            transaction: t
        });

        let updatedCount = 0;
        let missing = [];

        for (const permit of permits) {
            const dbName = permit.institution?.fullName || permit.institution?.shortName || '';
            const dbClean = normalizeName(dbName);

            // Special explicit mappings for the 11 edge cases
            let excelMatch = null;
            const findMatch = (pattern) => linkData.find(r => r.name.includes(pattern));

            if (dbClean === 'ngele-ngele kecil') excelMatch = findMatch('Ngele-Ngele');
            else if (dbClean === 'nurul simal') excelMatch = findMatch('Nurul Simal');
            else if (dbClean === 'satu hati') excelMatch = findMatch('Satu Hati');
            else if (dbClean === 'akesahu gamsungi') excelMatch = findMatch('Akesahu');
            else if (dbClean === 'sagela yef') excelMatch = findMatch('Sigela Yef');
            else if (dbClean === 'togoreba sungi') excelMatch = findMatch('Togereba Sungi');
            else if (dbClean === 'kupa kupa horimoi') excelMatch = findMatch('Kupa Kupa Horimaoi');
            else if (dbClean === 'pocao') excelMatch = findMatch('Pocoa');
            else if (dbClean === 'perkebunan bacan lippu mandiri') excelMatch = findMatch('Perkebunan Bacan Lippu Mandiri');
            else if (dbClean === 'ake membangun') excelMatch = findMatch('Ake Mambangun');
            else if (dbClean === 'lingga amo') excelMatch = findMatch('Lingga Lamo');

            // General matching
            if (!excelMatch) {
                excelMatch = linkData.find(r => normalizeName(r.name) === dbClean);
            }

            // Exact raw fallback
            if (!excelMatch) {
                excelMatch = linkData.find(r => r.name.toLowerCase().replace(/\s+/g, ' ') === dbName.toLowerCase().replace(/\s+/g, ' '));
            }

            if (excelMatch) {
                await permit.update({
                    pdfUrl: excelMatch.url || null
                }, { transaction: t });
                if (excelMatch.url) updatedCount++;
            } else {
                missing.push(dbName);
            }
        }

        await t.commit();
        console.log(`✅ Successfully saved PDF URLs for ${updatedCount} permits.`);
        if (missing.length > 0) {
            console.log(`❌ Could not match ${missing.length} DB records to Excel data.`);
        }

    } catch (error) {
        await t.rollback();
        console.error('Migration failed:', error);
    }
    process.exit(0);
}

extractExcelLinks();
