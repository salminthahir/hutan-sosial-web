const xlsx = require('xlsx');

const getRawExcelData = () => {
    const workbook = xlsx.readFile('/Users/macbooksale/Downloads/Rekapitulasi Persetujuan PS Malut.xlsx');
    const sheetName = 'KPS';
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet, { range: 3 });
};

(async () => {
    const data = getRawExcelData();

    const matches = data.filter(r => {
        const skKey = Object.keys(r).find(k => k.toLowerCase().includes('sk') && !k.toLowerCase().includes('peserta') && !k.toLowerCase().includes('jumlah'));
        if (!skKey) return false;

        const sk = String(r[skKey] || '').trim();
        return sk.includes('134') || sk.includes('60') || sk.includes('171');
    });

    matches.forEach(m => {
        console.log(`\nMatch found:`);
        console.log(JSON.stringify(m, null, 2));
    });
})();
