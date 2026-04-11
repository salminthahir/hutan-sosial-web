/**
 * Import XLSX Admin Script
 * Usage: node scripts/import_xlsx_admin.js path/to/file.xlsx
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { SocialForestPermits, Institutions, Villages } = require('../models');

async function run() {
    const filePath = process.argv[2];

    if (!filePath) {
        console.error('Harap sertakan file path. Contoh: node scripts/import_xlsx_admin.js data.xlsx');
        process.exit(1);
    }

    const absolutePath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
        console.error(`File tidak ditemukan: ${absolutePath}`);
        process.exit(1);
    }

    try {
        console.log(`Membaca file ${absolutePath}...`);
        const workbook = xlsx.readFile(absolutePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Ditemukan ${data.length} baris. Memproses...`);
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const row of data) {
            try {
                // Assuming basic headers like SK, Lembaga, Desa, Luas_SK
                const noSk = row['SK'] || row['NO_SK'] || row['Nomor SK'];
                if (!noSk) {
                    skipCount++;
                    continue;
                }

                // Cek apakah izin sudah ada
                const existing = await SocialForestPermits.findOne({ where: { permitNumber: noSk } });

                if (existing) {
                    console.log(`Izin ${noSk} sudah ada, melewati...`);
                    skipCount++;
                    continue;
                }

                // Dummy logic for import:
                // Find or Create Institution
                const lembagaName = row['Lembaga'] || row['Kelompok'] || 'Nama Lembaga Tidak Diketahui';
                const [inst] = await Institutions.findOrCreate({
                    where: { fullName: lembagaName },
                    defaults: { shortName: lembagaName.substring(0, 20), isActive: true }
                });

                // Find Village
                const desaName = row['Desa'] || '';
                let villageObj = await Villages.findOne({ where: { name: desaName } });

                // Create Permit
                await SocialForestPermits.create({
                    permitNumber: noSk,
                    permitYear: row['Tahun'] || new Date().getFullYear(),
                    institutionId: inst.id,
                    villageId: villageObj ? villageObj.id : null,
                    areaPermitted: parseFloat(row['Luas_SK']) || 0,
                    permitStatus: 'Izin'
                });
                successCount++;
            } catch (err) {
                console.error('Error baris:', row, err.message);
                errorCount++;
            }
        }

        console.log('\n--- Hasil Import ---');
        console.log(`Berhasil: ${successCount}`);
        console.log(`Dilewati: ${skipCount}`);
        console.log(`Error: ${errorCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

run();
