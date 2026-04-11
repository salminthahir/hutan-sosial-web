const fs = require('fs');
const db = require('../models');

function parseCSV(filepath) {
    const raw = fs.readFileSync(filepath, 'utf-8');
    const lines = raw.split(/\r?\n/).filter(l => l.trim() && !l.match(/^;+$/));

    // Header is line 0
    const headers = lines[0].split(';');
    console.log('CSV Headers:', headers.slice(0, 30).join(' | '));

    // Skip header row (line 0) and column-number row (line 1)
    const dataRows = [];
    for (let i = 2; i < lines.length; i++) {
        const cols = lines[i].split(';');
        const no = cols[0]?.trim();
        if (!no || isNaN(parseInt(no))) continue; // skip non-data rows

        dataRows.push({
            no: parseInt(no),
            fisik: cols[1]?.trim() || '-',
            pdf: cols[2]?.trim() || '-',
            serahTerima: cols[3]?.trim() || '-',
            x: cols[4]?.trim() || '',
            y: cols[5]?.trim() || '',
            jenisLembaga: cols[9]?.trim() || '',
            namaLembaga: cols[10]?.trim() || '',
            namaLengkap: cols[11]?.trim() || '',
            namaKetua: cols[12]?.trim() || '',
            kontak: cols[13]?.trim() || '',
            desa: cols[14]?.trim() || '',
            kecamatan: cols[15]?.trim() || '',
            kabupaten: cols[16]?.trim() || '',
            provinsi: cols[17]?.trim() || '',
            skema: cols[18]?.trim() || '',
            nomorIzin: cols[19]?.trim() || '',
            potensi: cols[20]?.trim() || '',
            statusSK: cols[21]?.trim() || '',
            tahun: cols[22]?.trim() || '',
            luasIzin: cols[23]?.trim() || '',
            luasProses: cols[24]?.trim() || '',
            statusKawasan: cols[25]?.trim() || '',
            anggota: cols[26]?.trim() || '',
            jmlKK: cols[27]?.trim() || '',
        });
    }
    return dataRows;
}

async function compare() {
    try {
        const csvPath = '/Users/macbooksale/Work/Projects/hutan-sosial-go.id/CSV/Daftar SK Izin PS Maluku Utara update 2025.csv';
        const csvRows = parseCSV(csvPath);
        console.log(`\n📊 CSV: ${csvRows.length} data rows found`);

        // Get all permits from DB
        const permits = await db.SocialForestPermits.findAll({
            include: [
                { model: db.Institutions, as: 'institution' },
                { model: db.PSSchemes, as: 'scheme' },
                {
                    model: db.Villages, as: 'village',
                    include: [{
                        model: db.Districts, as: 'district',
                        include: [{
                            model: db.Regencies, as: 'regency',
                            include: [{ model: db.Provinces, as: 'province' }]
                        }]
                    }]
                }
            ]
        });
        console.log(`📊 DB:  ${permits.length} permits found\n`);

        // Match by institution name
        let matched = 0;
        let unmatched = [];
        const dbNames = permits.map(p => ({
            name: (p.institution?.fullName || p.institution?.shortName || '').toLowerCase().trim(),
            permit: p
        }));

        // CSV entries not in DB
        for (const row of csvRows) {
            const csvName = row.namaLengkap.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
            const found = dbNames.find(d => {
                const dbName = d.name.replace(/^(hutan desa|hutan kemasyarakatan|hutan tanaman rakyat|hutan adat|kemitraan kehutanan|izin pemanfaatan hutan perhutanan sosial)\s+/i, '').toLowerCase().trim();
                // Also try matching with the raw institution name from CSV
                const csvClean = csvName.replace(/^(lphd|ld|kth|koperasi|poktan|gapoktanhut|gapoktan|kt)\s*/i, '').trim();
                return dbName === csvClean || d.name === csvName;
            });

            if (found) {
                matched++;
            } else {
                unmatched.push({
                    no: row.no,
                    name: row.namaLengkap,
                    desa: row.desa,
                    kab: row.kabupaten,
                    skema: row.skema,
                    status: row.statusSK
                });
            }
        }

        console.log(`✅ Matched: ${matched} / ${csvRows.length}`);
        console.log(`❌ Unmatched (CSV entries NOT in DB): ${unmatched.length}`);
        if (unmatched.length > 0) {
            console.log('\n--- Unmatched CSV entries ---');
            for (const u of unmatched) {
                console.log(`  #${u.no}: ${u.name} | ${u.desa}, ${u.kab} | ${u.skema} | ${u.status}`);
            }
        }

        // DB entries not in CSV
        const dbNotInCsv = [];
        for (const d of dbNames) {
            if (!d.name) continue;
            const dbClean = d.name.replace(/^(hutan desa|hutan kemasyarakatan|hutan tanaman rakyat|hutan adat|kemitraan kehutanan|izin pemanfaatan hutan perhutanan sosial)\s+/i, '').replace(/\s+(ld|kth|lphd|koperasi|poktan|gapoktanhut|gapoktan|kt|lpmd)$/i, '').toLowerCase().trim();

            const found = csvRows.find(row => {
                const csvClean = row.namaLengkap.replace(/^(LPHD|LD|KTH|Koperasi|Poktan|Gapoktanhut|Gapoktan|KT)\.\s*/i, '').toLowerCase().trim();
                return csvClean === dbClean;
            });

            if (!found) {
                dbNotInCsv.push({
                    id: d.permit.id,
                    name: d.name,
                    village: d.permit.village?.name || '-',
                    regency: d.permit.village?.district?.regency?.name || '-'
                });
            }
        }

        console.log(`\n📋 DB entries NOT in CSV: ${dbNotInCsv.length}`);
        if (dbNotInCsv.length > 0) {
            console.log('\n--- DB entries not in CSV ---');
            for (const d of dbNotInCsv.slice(0, 30)) {
                console.log(`  ID ${d.id}: ${d.name} | ${d.village}, ${d.regency}`);
            }
            if (dbNotInCsv.length > 30) console.log(`  ... and ${dbNotInCsv.length - 30} more`);
        }

        // Summary: new data available in CSV
        const hasCoords = csvRows.filter(r => r.x && r.y).length;
        const hasContact = csvRows.filter(r => r.kontak && r.kontak !== '-').length;
        const hasFisik = csvRows.filter(r => r.fisik === 'OK').length;
        const hasPdf = csvRows.filter(r => r.pdf === 'OK').length;
        const hasSerahTerima = csvRows.filter(r => r.serahTerima === 'OK').length;
        const hasPotensi = csvRows.filter(r => r.potensi && r.potensi !== '-').length;
        const hasStatusKawasan = csvRows.filter(r => r.statusKawasan && r.statusKawasan !== '-').length;
        const hasAnggota = csvRows.filter(r => r.anggota && r.anggota !== '-' && r.anggota !== '').length;

        console.log('\n📈 Data Availability Summary (CSV):');
        console.log(`  Coordinates (X,Y):    ${hasCoords} / ${csvRows.length}`);
        console.log(`  Contact (HP):         ${hasContact} / ${csvRows.length}`);
        console.log(`  Fisik Doc:            ${hasFisik} / ${csvRows.length}`);
        console.log(`  PDF Doc:              ${hasPdf} / ${csvRows.length}`);
        console.log(`  Serah Terima:         ${hasSerahTerima} / ${csvRows.length}`);
        console.log(`  Potensi/Komoditas:    ${hasPotensi} / ${csvRows.length}`);
        console.log(`  Status Kawasan:       ${hasStatusKawasan} / ${csvRows.length}`);
        console.log(`  Jumlah Anggota:       ${hasAnggota} / ${csvRows.length}`);

    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

compare();
