const xlsx = require('xlsx');
const fs = require('fs');

const FILE_PATH = '/Users/macbooksale/Work/Projects/hutan-sosial-go.id/Daftar SK Izin PS Maluku Utara update 2025.xlsx';

try {
    const workbook = xlsx.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const range = xlsx.utils.decode_range(worksheet['!ref']);
    
    // Read Headers
    let headers = {};
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[xlsx.utils.encode_cell({r: 0, c: C})];
        if (cell && cell.v) {
            headers[C] = cell.v.toString().trim();
        }
    }
    
    console.log("Headers detected:", headers);

    const updates = [];
    for (let R = 1; R <= range.e.r; ++R) {
        let nomorIzin = null;
        let hyperlink = null;
        let pdfText = null;

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[xlsx.utils.encode_cell({c: C, r: R})];
            if (!cell) continue;

            const colName = headers[C];
            if (colName === 'NOMOR IZIN') {
                nomorIzin = cell.v.toString().trim();
            } else if (colName === 'PDF') {
                pdfText = cell.v.toString().trim();
                if (cell.l && cell.l.Target) {
                    hyperlink = cell.l.Target;
                }
            }
        }

        if (nomorIzin && hyperlink) {
            updates.push({ nomorIzin, hyperlink });
        }
    }

    console.log(`Successfully extracted ${updates.length} hyperlinks from Excel.`);
    fs.writeFileSync('/tmp/extracted_links.json', JSON.stringify(updates, null, 2));

} catch (error) {
    console.error("Error reading Excel:", error);
}
