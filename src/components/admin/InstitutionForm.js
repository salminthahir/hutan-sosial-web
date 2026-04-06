"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import styles from '@/app/admin/institutions/institutions.module.css';

export default function InstitutionForm({ initialData = null, isEdit = false, onSubmit }) {
    const router = useRouter();

    const penyuluhContact = initialData?.contacts?.find(c => c.contactType === 'penyuluh')?.contactValue || '';
    const penyuluhParts = penyuluhContact.split('|').map(s => s.trim());

    const [formData, setFormData] = useState({
        fullName: initialData?.fullName || '',
        shortName: initialData?.shortName || '',
        chairmanName: initialData?.chairmanName || '',
        penyuluhName: penyuluhParts[0] || '',
        penyuluhPhone: penyuluhParts[1] || '',
        membersCount: initialData?.members?.[0]?.totalMembers || '',
        householdsCount: initialData?.members?.[0]?.totalHouseholds || '',
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button type="button" onClick={() => router.back()} className={styles.backBtn}>
                    <ChevronLeft size={18} /> Kembali
                </button>
                <button type="button" onClick={handleFormSubmit} disabled={loading} className={styles.saveBtn}>
                    <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Lembaga'}
                </button>
            </div>

            <div className={styles.formCard}>
                <h2 className={styles.sectionTitle}>{isEdit ? 'Ubah' : 'Biodata'} Kelembagaan</h2>
                
                <form id="institution-form" className={styles.formGrid}>
                    <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                        <label className={styles.label}>Nama Lembaga (Resmi) *</label>
                        <input
                            type="text"
                            name="fullName"
                            className={styles.input}
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Contoh: Lembaga Pengelola Hutan Desa Mutiara"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Singkatan Lembaga</label>
                        <input
                            type="text"
                            name="shortName"
                            className={styles.input}
                            value={formData.shortName}
                            onChange={handleChange}
                            placeholder="Contoh: LPHD Mutiara"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Nama Ketua Pengurus</label>
                        <input
                            type="text"
                            name="chairmanName"
                            className={styles.input}
                            value={formData.chairmanName}
                            onChange={handleChange}
                            placeholder="Contoh: Budi Santoso"
                        />
                    </div>

                    {/* Section Pendamping */}
                    <div className={styles.fullWidth} style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '16px' }}>
                        <h3 className={styles.label} style={{ fontSize: '15px', color: '#111' }}>Data Penyuluh / Pendamping</h3>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Nama Penyuluh</label>
                        <input
                            type="text"
                            name="penyuluhName"
                            className={styles.input}
                            value={formData.penyuluhName}
                            onChange={handleChange}
                            placeholder="Contoh: Siska Pratiwi"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Nomor Handphone Penyuluh</label>
                        <input
                            type="tel"
                            name="penyuluhPhone"
                            className={styles.input}
                            value={formData.penyuluhPhone}
                            onChange={handleChange}
                            placeholder="Contoh: 08123456789"
                        />
                    </div>

                    {/* Section Statistik Pengurus */}
                    <div className={styles.fullWidth} style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '16px' }}>
                        <h3 className={styles.label} style={{ fontSize: '15px', color: '#111' }}>Statistik Anggota Lembaga</h3>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Jumlah Individu (Orang)</label>
                        <input
                            type="number"
                            name="membersCount"
                            className={styles.input}
                            value={formData.membersCount}
                            onChange={handleChange}
                            min="0"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Jumlah Kelompok Keluarga (KK)</label>
                        <input
                            type="number"
                            name="householdsCount"
                            className={styles.input}
                            value={formData.householdsCount}
                            onChange={handleChange}
                            min="0"
                        />
                    </div>

                    <div className={styles.field} style={{ gridColumn: 'span 2', marginTop: '12px' }}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="isActive"
                                className={styles.checkboxInput}
                                checked={formData.isActive}
                                onChange={handleChange}
                            />
                            Data Lembaga Aktif
                        </label>
                    </div>

                </form>
            </div>
        </div>
    );
}
