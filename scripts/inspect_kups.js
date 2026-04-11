const XLSX = require('xlsx');

const filePath = '/Users/macbooksale/Work/Projects/hutan-sosial-go.id/Rekapitulasi Persetujuan PS Malut.xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['KPS'];
const range = XLSX.utils.decode_range(sheet['!ref']);

// KUPS columns are from index 55-63, Ekonomi Produksi are 64-68
// Let's see the column headers
console.log('=== KUPS + EKONOMI PRODUKSI COLUMNS ===');
for (let R = 0; R <= 1; R++) {
    let row = [];
    for (let C = 55; C <= 67; C++) {
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        const cell = sheet[cellRef];
        row.push(`[${C}] ${cell ? String(cell.v).substring(0, 35) : '-'}`);
    }
    console.log(`Row ${R}: ${row.join(' | ')}`);
}

// Sample data rows 3-15
console.log('\n=== SAMPLE DATA (Rows 3-15) ===');
const colNames = ['NamaKUPS', 'Ketua', 'Anggota', 'Komoditas', 'KapUsaha', 'NIB', 'AksesModal', 'Kelas', 'Offtaker', 'Harga', 'VolSerap', 'BiayaAngkut', 'Ekspor'];
for (let R = 3; R <= 15; R++) {
    let row = {};
    for (let i = 0; i < colNames.length; i++) {
        const C = 55 + i;
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        const cell = sheet[cellRef];
        row[colNames[i]] = cell ? String(cell.v).substring(0, 40) : '';
    }
    // Also get the institution name (col 2)
    const nameRef = XLSX.utils.encode_cell({ c: 2, r: R });
    const nameCell = sheet[nameRef];
    const instName = nameCell ? nameCell.v : '';

    if (instName || row.NamaKUPS) {
        console.log(`Row ${R} [${instName}]:`, JSON.stringify(row));
    }
}

// Count rows with KUPS data
let kupsCount = 0;
let ekonomiCount = 0;
for (let R = 3; R <= range.e.r; R++) {
    const kupsRef = XLSX.utils.encode_cell({ c: 55, r: R });
    const kupsCell = sheet[kupsRef];
    if (kupsCell && kupsCell.v && String(kupsCell.v).trim() && kupsCell.v !== '-') kupsCount++;

    const offRef = XLSX.utils.encode_cell({ c: 63, r: R });
    const offCell = sheet[offRef];
    if (offCell && offCell.v && String(offCell.v).trim() && offCell.v !== '-') offCount++;
}
let offCount = 0;
for (let R = 3; R <= range.e.r; R++) {
    const offRef = XLSX.utils.encode_cell({ c: 63, r: R });
    const offCell = sheet[offRef];
    if (offCell && offCell.v && String(offCell.v).trim() && offCell.v !== '-') offCount++;
}
console.log(`\nTotal rows with KUPS name: ${kupsCount}`);
console.log(`Total rows with Offtaker data: ${offCount}`);
