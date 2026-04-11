const XLSX = require('xlsx');

function investigate() {
    const filePath = '/Users/macbooksale/Work/Projects/hutan-sosial-go.id/CSV/Daftar SK Izin PS Maluku Utara update 2025.xlsx';
    console.log(`Reading: ${filePath}`);

    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    console.log(`Sheet: ${sheetName}`);

    // The PDF column is around index 2 (C) based on the CSV (No, FISIK, PDF).
    // Let's check a few rows, for example row 3 to 10.

    for (let i = 3; i <= 10; i++) {
        const cellAddress = `C${i}`; // Assuming column C is PDF
        const cell = sheet[cellAddress];

        let link = 'None';
        let val = cell ? cell.v : 'Empty';

        if (cell && cell.l && cell.l.Target) {
            link = cell.l.Target;
        }

        console.log(`Row ${i} | Val: ${val} | Link: ${link}`);
    }
}

investigate();
