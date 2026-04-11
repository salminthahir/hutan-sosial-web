const xlsx = require('xlsx');

const workbook = xlsx.readFile('/Users/macbooksale/Downloads/Rekapitulasi Persetujuan PS Malut.xlsx');
console.log('Available sheets:', workbook.SheetNames);
