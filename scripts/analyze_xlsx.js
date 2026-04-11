const XLSX = require('xlsx');
const wb = XLSX.readFile('/Users/macbooksale/Work/Projects/hutan-sosial-go.id/rawdata/untitled.xlsx');
const ws = wb.Sheets['untitled'];
const allData = XLSX.utils.sheet_to_json(ws, { defval: null });

// Row 1 is header, data starts from row 2
const headers = Object.values(allData[0]);
const data = allData.slice(1);
console.log('Total data rows:', data.length);
console.log('');

// Map to named keys
const mapped = data.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row['Column' + (i + 1)]; });
    return obj;
});

// Unique values
['SKEMA', 'NAMA_PROV', 'NAMA_KAB', 'Status'].forEach(col => {
    const vals = {};
    mapped.forEach(r => { const v = String(r[col] || ''); vals[v] = (vals[v] || 0) + 1; });
    console.log(col + ':');
    Object.entries(vals).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
    console.log('');
});

// Jml_KK analysis
console.log('=== Jml_KK (Jumlah KK) ANALYSIS ===');
let kkTotal = 0, kkZero = 0, kkNull = 0, kkPositive = 0;
mapped.forEach(r => {
    const kk = Number(r['Jml_KK']);
    if (isNaN(kk) || r['Jml_KK'] === null) kkNull++;
    else if (kk === 0) kkZero++;
    else { kkPositive++; kkTotal += kk; }
});
console.log('  Rows with KK > 0: ' + kkPositive);
console.log('  Rows with KK = 0: ' + kkZero);
console.log('  Rows with KK null/NaN: ' + kkNull);
console.log('  Total KK sum: ' + kkTotal);
console.log('  Sample KK values (first 10 non-zero):');
let cnt = 0;
mapped.forEach(r => {
    const kk = Number(r['Jml_KK']);
    if (kk > 0 && cnt < 10) {
        console.log('    ' + r['NAMA_DESA'] + ' (' + r['LEMBAGA'] + '): ' + kk + ' KK');
        cnt++;
    }
});

// WKT analysis
console.log('');
console.log('=== WKT (Well-Known Text) ANALYSIS ===');
let wktPoly = 0, wktMulti = 0, wktNull = 0, wktOther = 0;
mapped.forEach(r => {
    const w = String(r['wkt'] || '');
    if (!w || w === 'null') wktNull++;
    else if (w.startsWith('MULTIPOLYGON')) wktMulti++;
    else if (w.startsWith('POLYGON')) wktPoly++;
    else wktOther++;
});
console.log('  POLYGON: ' + wktPoly);
console.log('  MULTIPOLYGON: ' + wktMulti);
console.log('  null/empty: ' + wktNull);
console.log('  other: ' + wktOther);

// Forest area breakdown
console.log('');
console.log('=== FOREST AREA BREAKDOWN ===');
let totalHK = 0, totalHL = 0, totalHPT = 0, totalHP = 0, totalHPK = 0, totalSK = 0;
mapped.forEach(r => {
    totalHK += Number(r['Luas_HK']) || 0;
    totalHL += Number(r['LUAS_HL']) || 0;
    totalHPT += Number(r['LUAS_HPT']) || 0;
    totalHP += Number(r['LUAS_HP']) || 0;
    totalHPK += Number(r['LUAS_HPK']) || 0;
    totalSK += Number(r['LUAS_SK']) || 0;
});
console.log('  Total Luas HK: ' + totalHK.toFixed(0) + ' ha');
console.log('  Total Luas HL: ' + totalHL.toFixed(0) + ' ha');
console.log('  Total Luas HPT: ' + totalHPT.toFixed(0) + ' ha');
console.log('  Total Luas HP: ' + totalHP.toFixed(0) + ' ha');
console.log('  Total Luas HPK: ' + totalHPK.toFixed(0) + ' ha');
console.log('  Total Luas SK: ' + totalSK.toFixed(0) + ' ha');

// Outlier check
console.log('');
console.log('=== OUTLIER CHECK ===');
const validSkema = ['PPHD', 'PPHKm', 'PHTr', 'IPHPS'];
mapped.forEach((r, i) => {
    const skema = String(r['SKEMA'] || '');
    if (!validSkema.includes(skema)) {
        console.log('  Row ' + (i + 2) + ': SKEMA=' + skema + ' | DESA=' + r['NAMA_DESA'] + ' | NO_SK=' + String(r['NO_SK'] || '').substring(0, 50));
    }
});

// Check Jml_KK in DB - compare
console.log('');
console.log('=== NAMA_KEC unique count: ' + new Set(mapped.map(r => r['NAMA_KEC'])).size + ' ===');
console.log('=== NAMA_DESA unique count: ' + new Set(mapped.map(r => r['NAMA_DESA'])).size + ' ===');
console.log('=== LEMBAGA unique count: ' + new Set(mapped.map(r => r['LEMBAGA'])).size + ' ===');
console.log('=== NO_SK unique count: ' + new Set(mapped.map(r => r['NO_SK'])).size + ' ===');
