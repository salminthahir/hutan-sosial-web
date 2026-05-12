// Final comparison script with correct Excel column names
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'CSV', 'DATA KUPS MALUKU UTARA.xlsx');
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = XLSX.utils.sheet_to_json(ws);

// Actual column names from Excel:
// No, Tahun Pembentukan, Skema PS, Nama Lembaga, Nama KUPS, 
// Ketua Kelompok KUPS, Nomor Kontak, Desa / Dusun / Kampung/Kelurahan, 
// Kecamatan / Distrik, Kota / Kabupaten, Provinsi, 
// Nomor SK Persetujuan, Nomor SK KUPS, Potensi / Komoditas, 
// Jenis Usaha, Klaster, Kelas KUPS, Tahun Peningkatan GOLD, Alamat Lengkap

console.log('=== EXCEL DATA: 442 KUPS Records ===\n');

// Stats with correct column names
const byScheme = {};
const byRegency = {};
const byYear = {};
const byKelasKUPS = {};
const byKlaster = {};
const uniqueSKs = new Set();
const uniqueSKKUPS = new Set();

excelData.forEach(row => {
    const scheme = row['Skema PS'] || 'N/A';
    const regency = row['Kota / Kabupaten'] || 'N/A';
    const year = row['Tahun Pembentukan'] || 'N/A';
    const kelas = row['Kelas KUPS'] || 'N/A';
    const klaster = row['Klaster'] || 'N/A';
    const sk = row['Nomor SK Persetujuan'] || '';
    const skKups = row['Nomor SK KUPS'] || '';
    
    byScheme[scheme] = (byScheme[scheme] || 0) + 1;
    byRegency[regency] = (byRegency[regency] || 0) + 1;
    byYear[year] = (byYear[year] || 0) + 1;
    byKelasKUPS[kelas] = (byKelasKUPS[kelas] || 0) + 1;
    byKlaster[klaster] = (byKlaster[klaster] || 0) + 1;
    if (sk) uniqueSKs.add(sk);
    if (skKups) uniqueSKKUPS.add(skKups);
});

console.log('--- Distribusi per Skema PS ---');
Object.entries(byScheme).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\n--- Distribusi per Kabupaten/Kota ---');
Object.entries(byRegency).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\n--- Distribusi per Tahun Pembentukan ---');
Object.entries(byYear).sort().forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\n--- Distribusi per Kelas KUPS ---');
Object.entries(byKelasKUPS).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\n--- Distribusi per Klaster ---');
Object.entries(byKlaster).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log(`\n--- Unique Nomor SK Persetujuan: ${uniqueSKs.size} ---`);
console.log(`--- Unique Nomor SK KUPS: ${uniqueSKKUPS.size} ---`);

// Data completeness
const fields = [
    'Tahun Pembentukan', 'Skema PS', 'Nama Lembaga', 'Nama KUPS',
    'Ketua Kelompok KUPS', 'Nomor Kontak', 'Desa / Dusun / Kampung/Kelurahan',
    'Kecamatan / Distrik', 'Kota / Kabupaten', 'Provinsi',
    'Nomor SK Persetujuan', 'Nomor SK KUPS', 'Potensi / Komoditas',
    'Jenis Usaha', 'Klaster', 'Kelas KUPS', 'Tahun Peningkatan GOLD', 'Alamat Lengkap'
];

console.log('\n\n=== DATA COMPLETENESS ===');
fields.forEach(f => {
    const filled = excelData.filter(r => r[f] !== undefined && r[f] !== null && r[f] !== '').length;
    const pct = (filled/excelData.length*100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct/5)) + '░'.repeat(20 - Math.round(pct/5));
    console.log(`  ${bar} ${pct}% - ${f} (${filled}/${excelData.length})`);
});

// Show 5 sample rows properly
console.log('\n\n=== SAMPLE 5 ROWS ===');
for (let i = 0; i < 5; i++) {
    const r = excelData[i];
    console.log(`\n--- KUPS #${i+1} ---`);
    console.log(`  Nama KUPS: ${r['Nama KUPS']}`);
    console.log(`  Ketua: ${r['Ketua Kelompok KUPS']}`);
    console.log(`  Tahun: ${r['Tahun Pembentukan']}`);
    console.log(`  Skema PS: ${r['Skema PS']}`);
    console.log(`  Nama Lembaga: ${r['Nama Lembaga']}`);
    console.log(`  Desa: ${r['Desa / Dusun / Kampung/Kelurahan']}`);
    console.log(`  Kecamatan: ${r['Kecamatan / Distrik']}`);
    console.log(`  Kab/Kota: ${r['Kota / Kabupaten']}`);
    console.log(`  SK Persetujuan: ${r['Nomor SK Persetujuan']}`);
    console.log(`  SK KUPS: ${r['Nomor SK KUPS']}`);
    console.log(`  Komoditas: ${r['Potensi / Komoditas']}`);
    console.log(`  Jenis Usaha: ${r['Jenis Usaha']}`);
    console.log(`  Klaster: ${r['Klaster']}`);
    console.log(`  Kelas KUPS: ${r['Kelas KUPS']}`);
    console.log(`  No HP: ${r['Nomor Kontak']}`);
    console.log(`  Tahun GOLD: ${r['Tahun Peningkatan GOLD']}`);
    console.log(`  Alamat: ${r['Alamat Lengkap']}`);
}

// === COMPARE WITH DB MODEL ===
console.log('\n\n========================================');
console.log('=== DB MODEL KUPS vs EXCEL COLUMNS ===');
console.log('========================================\n');

console.log('--- Current DB Model (KUPS.js) --- only 6 fields:');
console.log('  ✅ name (STRING)            → "Nama KUPS"');
console.log('  ✅ chairmanName (STRING)     → "Ketua Kelompok KUPS"');
console.log('  ✅ totalMembers (STRING)     → ❌ NOT IN EXCEL (column does not exist)');
console.log('  ✅ commodities (STRING)      → "Potensi / Komoditas"');
console.log('  ✅ businessClass (STRING)    → "Kelas KUPS"');
console.log('  ✅ permitId (INTEGER FK)     → lookup via "Nomor SK Persetujuan"');

console.log('\n--- Excel columns MISSING from DB Model ---');
console.log('  ❌ "Tahun Pembentukan"               → Tahun kapan KUPS dibentuk');
console.log('  ❌ "Nama Lembaga"                     → Nama lembaga PS parent (Denormalized, exists via Permit→Institution)');
console.log('  ❌ "Nomor Kontak"                     → NO HP Ketua KUPS');
console.log('  ❌ "Desa / Dusun / Kampung/Kelurahan" → Lokasi KUPS (Denormalized, exists via Permit→Village)');
console.log('  ❌ "Kecamatan / Distrik"              → (Denormalized)');
console.log('  ❌ "Kota / Kabupaten"                 → (Denormalized)');
console.log('  ❌ "Provinsi"                         → (Denormalized)');
console.log('  ❌ "Nomor SK KUPS"                    → SK khusus untuk KUPS (PENTING)');
console.log('  ❌ "Jenis Usaha"                      → Detail jenis usaha KUPS');
console.log('  ❌ "Klaster"                          → Klaster/Cluster kategori usaha');
console.log('  ❌ "Tahun Peningkatan GOLD"           → Tahun upgrade ke Gold');
console.log('  ❌ "Alamat Lengkap"                   → Alamat lengkap KUPS');
