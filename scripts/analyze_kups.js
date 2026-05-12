const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, '..', '..', 'CSV', 'DATA KUPS MALUKU UTARA.xlsx');
const wb = XLSX.readFile(filePath);

console.log('=== SHEETS ===');
console.log(wb.SheetNames);

for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    
    console.log(`\n=== Sheet: "${sheetName}" ===`);
    console.log(`Total rows (including header): ${data.length}`);
    
    // Print header
    if (data.length > 0) {
        console.log('Headers:', JSON.stringify(data[0]));
    }
    
    // Print all data rows
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row && row.length > 0 && row.some(v => v !== null && v !== undefined && v !== '')) {
            console.log(`  Row ${i}: ${JSON.stringify(row)}`);
        }
    }
}
