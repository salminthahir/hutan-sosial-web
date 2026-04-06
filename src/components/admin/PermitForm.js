'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/adminAuth';
import styles from './PermitForm.module.css';

// Simple reusable autocomplete for async data
function AsyncAutocomplete({ label, endpoint, idField = 'id', labelField = 'name', value, onChange, placeholder }) {
    const { authFetch } = useAuth();
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Initial fetch to resolve the name of the prepopulated value
    useEffect(() => {
        if (value && endpoint && options.length === 0 && !query) {
             // We can't easily fetch just one item by ID with these generic endpoints,
             // so we expect the parent to pass the initial search text if possible,
             // or we just fetch default options.
             fetchOptions('');
        }
    }, [value]); // eslint-disable-line

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchOptions = async (searchStr) => {
        setLoading(true);
        try {
            const separator = endpoint.includes('?') ? '&' : '?';
            const url = `${endpoint}${separator}q=${searchStr}&search=${searchStr}&limit=50`;
            const data = await authFetch(url);
            setOptions(data.data || []);
        } catch (e) {
            console.error('Error fetching autocomplete:', e);
        }
        setLoading(false);
    };

    const handleSearch = (e) => {
        const val = e.target.value;
        setQuery(val);
        setIsOpen(true);
        // Simple debounce
        if (wrapperRef.current.timeout) clearTimeout(wrapperRef.current.timeout);
        wrapperRef.current.timeout = setTimeout(() => {
            fetchOptions(val);
        }, 300);
    };

    const handleSelect = (option) => {
        setQuery(option[labelField] || option.fullName || option.shortName || option.name);
        onChange(option[idField]);
        setIsOpen(false);
    };

    // Find current label if value is set but query is empty
    const currentDisplay = query || (options.find(o => o[idField] === value) && (options.find(o => o[idField] === value)[labelField] || options.find(o => o[idField] === value).fullName)) || (value ? `Terpilih ID: ${value} (Ketik untuk ubah)` : '');

    return (
        <div className={styles.field} ref={wrapperRef}>
            <label className={styles.label}>{label}</label>
            <div className={styles.autocompleteWrapper}>
                <input
                    type="text"
                    className={styles.input}
                    value={isOpen ? query : currentDisplay}
                    onChange={handleSearch}
                    onClick={() => { setIsOpen(true); if(!options.length) fetchOptions(''); }}
                    placeholder={placeholder}
                />
                {isOpen && (
                    <div className={styles.dropdown}>
                        {loading ? (
                            <div className={styles.dropdownItem}>Loading...</div>
                        ) : options.length > 0 ? (
                            options.map(opt => (
                                <div
                                    key={opt[idField]}
                                    className={`${styles.dropdownItem} ${value === opt[idField] ? styles.dropdownSelected : ''}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    {opt[labelField] || opt.fullName || opt.shortName || opt.name}
                                </div>
                            ))
                        ) : (
                            <div className={styles.dropdownItem}>Tidak ditemukan</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PermitForm({ initialData = null, onSubmit, loading = false }) {
    const { authFetch } = useAuth();
    
    // Form state
    const [formData, setFormData] = useState({
        permitNumber: initialData?.permitNumber || '',
        permitYear: initialData?.permitYear || '',
        permitDate: initialData?.permitDate ? new Date(initialData.permitDate).toISOString().split('T')[0] : '', // kept for backwards compatibility if needed
        validFrom: initialData?.validFrom ? new Date(initialData.validFrom).toISOString().split('T')[0] : '',
        validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
        permitStatus: initialData?.permitStatus || 'Proses',
        areaPermitted: initialData?.areaPermitted || '',
        areaInProcess: initialData?.areaInProcess || '',
        schemeId: initialData?.schemeId || '',
        institutionId: initialData?.institutionId || '',
        villageId: initialData?.villageId || '',
        hasPhysicalDoc: initialData?.hasPhysicalDoc || false,
        hasPdfDoc: initialData?.hasPdfDoc || false,
        pdfUrl: initialData?.pdfUrl || '',
        hasHandover: initialData?.hasHandover || false,
        hasLandConflict: initialData?.hasLandConflict || false,
        roadAccessType: initialData?.roadAccessType || '',
        portAccess: initialData?.portAccess || false,
        distanceToMarket: initialData?.distanceToMarket || '',
        notes: initialData?.notes || '',
        commodities: initialData?.permitCommodities?.map(c => c.commodityId) || [],
        forestStatuses: initialData?.permitForestStatuses?.map(s => s.statusId) || [],
        boundary: initialData?.boundary || null
    });

    const [kups, setKups] = useState(initialData?.kups || []);
    const [instInfo, setInstInfo] = useState(null);

    const [schemes, setSchemes] = useState([]);
    const [allCommodities, setAllCommodities] = useState([]);
    const [allForestStatuses, setAllForestStatuses] = useState([]);

    useEffect(() => {
        async function loadReference() {
            try {
                const [resSchemes, resCom, resFor] = await Promise.all([
                    authFetch('/api/admin/reference/schemes'),
                    authFetch('/api/admin/reference/commodities'),
                    authFetch('/api/admin/reference/forest-statuses')
                ]);
                setSchemes(resSchemes.data || []);
                setAllCommodities(resCom.data || []);
                setAllForestStatuses(resFor.data || []);
            } catch(e) { console.error(e); }
        }
        loadReference();
    }, [authFetch]);

    useEffect(() => {
        if (!formData.institutionId) {
            setInstInfo(null);
            return;
        }
        async function fetchInst() {
            try {
                const res = await authFetch(`/api/admin/institutions/${formData.institutionId}`);
                if (res.success) setInstInfo(res.data);
            } catch (e) { console.error('Error fetching institution details', e); }
        }
        fetchInst();
    }, [formData.institutionId, authFetch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSelectChange = (field, val) => {
        setFormData(prev => ({ ...prev, [field]: val }));
    };

    const handleCheckboxArrayChange = (field, id, checked) => {
        setFormData(prev => {
            const currentArray = prev[field] || [];
            if (checked) {
                return { ...prev, [field]: [...currentArray, id] };
            } else {
                return { ...prev, [field]: currentArray.filter(v => v !== id) };
            }
        });
    };

    const handleGeojsonUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                // Extract geometry
                if (json.type === 'FeatureCollection' && json.features && json.features[0].geometry) {
                    setFormData(prev => ({ ...prev, boundary: json.features[0].geometry }));
                    alert('GeoJSON map area berhasil diekstrak!');
                } else if (json.type === 'Polygon' || json.type === 'MultiPolygon') {
                    setFormData(prev => ({ ...prev, boundary: json }));
                    alert('GeoJSON Polygon berhasil diekstrak!');
                } else if (json.geometry) {
                    setFormData(prev => ({ ...prev, boundary: json.geometry }));
                    alert('GeoJSON map geometry berhasil diekstrak!');
                } else {
                    alert('Format GeoJSON tidak dikenali. Pastikan file valid.');
                }
            } catch (err) {
                console.error(err);
                alert('Gagal membaca JSON. File korup atau format salah.');
            }
        };
        reader.readAsText(file);
    };

    const addKups = () => setKups(prev => [...prev, { name: '', chairmanName: '', totalMembers: '', commodities: '', businessClass: '' }]);
    const removeKups = (index) => setKups(prev => prev.filter((_, i) => i !== index));
    const handleKupsChange = (index, field, value) => {
        setKups(prev => {
            const newKups = [...prev];
            newKups[index][field] = value;
            return newKups;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...formData, kups });
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
                {/* General Info */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Informasi SK</h3>
                    
                    <div className={styles.field}>
                        <label className={styles.label}>Nomor SK <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            name="permitNumber"
                            required
                            className={styles.input}
                            value={formData.permitNumber}
                            onChange={handleChange}
                            placeholder="Contoh: SK.9361/MENLHK..."
                        />
                    </div>

                    <div className={styles.fieldRow}>
                         <div className={styles.field}>
                            <label className={styles.label}>Tanggal Terbit (Valid From)</label>
                            <input
                                type="date"
                                name="validFrom"
                                className={styles.input}
                                value={formData.validFrom}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Berlaku Hingga (Valid Until)</label>
                            <input
                                type="date"
                                name="validUntil"
                                className={styles.input}
                                value={formData.validUntil}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className={styles.fieldRow}>
                        <div className={styles.field}>
                            <label className={styles.label}>Status <span className={styles.required}>*</span></label>
                            <select
                                name="permitStatus"
                                required
                                className={styles.input}
                                value={formData.permitStatus}
                                onChange={handleChange}
                            >
                                <option value="Proses">Proses</option>
                                <option value="Izin">Izin</option>
                            </select>
                        </div>
                        
                        <div className={styles.field}>
                            <label className={styles.label}>Tahun SK</label>
                            <input
                                type="number"
                                name="permitYear"
                                className={styles.input}
                                value={formData.permitYear}
                                onChange={handleChange}
                                placeholder="Contoh: 2024"
                            />
                        </div>
                    </div>

                    <div className={styles.fieldRow}>
                        <div className={styles.field}>
                            <label className={styles.label}>Luas Diizinkan (Ha)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="areaPermitted"
                                className={styles.input}
                                value={formData.areaPermitted}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Luas Proses (Ha)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="areaInProcess"
                                className={styles.input}
                                value={formData.areaInProcess}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    
                    <div className={styles.field}>
                        <label className={styles.label}>Peta Polygon (Unggah File .geojson)</label>
                        <input
                            type="file"
                            accept=".geojson,.json"
                            className={styles.input}
                            onChange={handleGeojsonUpload}
                            style={{ padding: '8px' }}
                        />
                        {formData.boundary && <span style={{ fontSize: '12px', color: '#2e7d32', marginTop: '4px', display: 'block' }}>✔ Data polygon / geometri telah dimasukkan</span>}
                        <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>File akan langsung diekstrak sebagai koordinat peta digital.</p>
                    </div>
                </div>

                {/* Relasi Utama */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Lembaga & Wilayah</h3>

                    <div className={styles.field}>
                        <label className={styles.label}>Skema Perhutanan <span className={styles.required}>*</span></label>
                        <select
                            name="schemeId"
                            required
                            className={styles.input}
                            value={formData.schemeId}
                            onChange={handleChange}
                        >
                            <option value="">-- Pilih Skema --</option>
                            {schemes.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    </div>

                    <AsyncAutocomplete
                        label="Lembaga Penerima"
                        endpoint="/api/admin/institutions"
                        idField="id"
                        labelField="fullName"
                        placeholder="Ketik nama lembaga..."
                        value={formData.institutionId}
                        onChange={(val) => handleSelectChange('institutionId', val)}
                    />

                    <AsyncAutocomplete
                        label="Desa / Kelurahan"
                        endpoint="/api/admin/reference/villages"
                        idField="id"
                        labelField="name"
                        placeholder="Ketik nama desa..."
                        value={formData.villageId}
                        onChange={(val) => handleSelectChange('villageId', val)}
                    />

                    {instInfo && (
                        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid #e9ecef', marginTop: '12px', fontSize: '13px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Pratinjau Data Lembaga</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#555' }}>
                                <div><span style={{ color: '#888' }}>Ketua:</span> {instInfo.chairmanName || '-'}</div>
                                <div><span style={{ color: '#888' }}>Jumlah Anggota:</span> {instInfo.members?.[0]?.totalMembers || '-'} Orang</div>
                                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#888' }}>Penyuluh/Pendamping:</span> {instInfo.contacts?.find(c => c.contactType === 'penyuluh')?.contactValue || '-'}</div>
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>* Data Penyuluh dan Anggota dikelola pada menu "Kelola Lembaga".</div>
                        </div>
                    )}

                     <div className={styles.field} style={{marginTop: '8px'}}>
                        <label className={styles.label}>Status Kawasan Hutan</label>
                        <div className={styles.checkboxGrid}>
                            {allForestStatuses.map(status => (
                                <label key={status.id} className={styles.checkboxLabel}>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.forestStatuses.includes(status.id)}
                                        onChange={(e) => handleCheckboxArrayChange('forestStatuses', status.id, e.target.checked)}
                                    />
                                    {status.name}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Dokumen & Akses */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Dokumen & Legalitas</h3>
                    
                    <div className={styles.checkboxRow}>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" name="hasPhysicalDoc" checked={formData.hasPhysicalDoc} onChange={handleCheckboxChange} />
                            Ada Dokumen Fisik
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" name="hasPdfDoc" checked={formData.hasPdfDoc} onChange={handleCheckboxChange} />
                            Ada File PDF
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" name="hasHandover" checked={formData.hasHandover} onChange={handleCheckboxChange} />
                            Sudah Serah Terima (Handover)
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" name="hasLandConflict" checked={formData.hasLandConflict} onChange={handleCheckboxChange} />
                            Ada Konflik Lahan
                        </label>
                    </div>

                    {formData.hasPdfDoc && (
                        <div className={styles.field}>
                            <label className={styles.label}>URL File / PDF Link</label>
                            <input type="url" name="pdfUrl" className={styles.input} value={formData.pdfUrl} onChange={handleChange} placeholder="https://..." />
                        </div>
                    )}

                    <div className={styles.field}>
                        <label className={styles.label}>Catatan Khusus</label>
                        <textarea 
                            name="notes" 
                            className={styles.input} 
                            style={{minHeight: '80px', resize: 'vertical'}}
                            value={formData.notes} 
                            onChange={handleChange}
                            placeholder="Catatan tambahan (opsional)"
                        />
                    </div>
                </div>

                {/* Akses & Komoditi */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Potensi & Akses</h3>

                    <div className={styles.fieldRow}>
                        <div className={styles.field}>
                            <label className={styles.label}>Akses Jalan Raya</label>
                            <select name="roadAccessType" className={styles.input} value={formData.roadAccessType} onChange={handleChange}>
                                <option value="">Tidak diketahui</option>
                                <option value="Aspal">Aspal</option>
                                <option value="Tanah/Makadam">Tanah/Makadam</option>
                                <option value="Transportasi Air">Transportasi Air</option>
                                <option value="Tidak Ada Akses">Tidak Ada Akses</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Jarak ke Pasar (Km)</label>
                            <input type="number" step="0.1" name="distanceToMarket" className={styles.input} value={formData.distanceToMarket} onChange={handleChange} />
                        </div>
                    </div>

                    <label className={styles.checkboxLabel} style={{marginTop: '8px', marginBottom: '16px'}}>
                         <input type="checkbox" name="portAccess" checked={formData.portAccess} onChange={handleCheckboxChange} />
                         Memiliki Akses Pelabuhan
                    </label>

                    <div className={styles.field}>
                        <label className={styles.label}>Komoditi yang Dikelola</label>
                        <div className={styles.checkboxListScrollable}>
                            {allCommodities.map(com => (
                                <label key={com.id} className={styles.checkboxLabel}>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.commodities.includes(com.id)}
                                        onChange={(e) => handleCheckboxArrayChange('commodities', com.id, e.target.checked)}
                                    />
                                    {com.name}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Profil KUPS */}
                <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Profil KUPS (Kelompok Usaha)</h3>
                        <button type="button" onClick={addKups} style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                            + Tambah KUPS
                        </button>
                    </div>

                    {kups.length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Belum ada data KUPS. Klik tombol + Tambah KUPS untuk mendaftarkan unit usaha.</p>
                    ) : (
                        kups.map((k, index) => (
                            <div key={index} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#fafafa', position: 'relative' }}>
                                <button type="button" onClick={() => removeKups(index)} style={{ position: 'absolute', top: '12px', right: '12px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Hapus</button>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                    <div className={styles.field} style={{ marginBottom: 0 }}>
                                        <label className={styles.label}>Nama KUPS</label>
                                        <input type="text" className={styles.input} placeholder="Contoh: KUPS Madu Hutan" value={k.name} onChange={(e) => handleKupsChange(index, 'name', e.target.value)} required />
                                    </div>
                                    <div className={styles.field} style={{ marginBottom: 0 }}>
                                        <label className={styles.label}>Nama Ketua</label>
                                        <input type="text" className={styles.input} value={k.chairmanName} onChange={(e) => handleKupsChange(index, 'chairmanName', e.target.value)} />
                                    </div>
                                    <div className={styles.field} style={{ marginBottom: 0 }}>
                                        <label className={styles.label}>Anggota (Orang)</label>
                                        <input type="number" className={styles.input} value={k.totalMembers} onChange={(e) => handleKupsChange(index, 'totalMembers', e.target.value)} />
                                    </div>
                                    <div className={styles.field} style={{ marginBottom: 0 }}>
                                        <label className={styles.label}>Komoditas Utama</label>
                                        <input type="text" className={styles.input} placeholder="Contoh: Madu, Cengkeh" value={k.commodities} onChange={(e) => handleKupsChange(index, 'commodities', e.target.value)} />
                                    </div>
                                    <div className={styles.field} style={{ marginBottom: 0 }}>
                                        <label className={styles.label}>Kelas Usaha</label>
                                        <select className={styles.input} value={k.businessClass} onChange={(e) => handleKupsChange(index, 'businessClass', e.target.value)}>
                                            <option value="">-- Pilih Kelas --</option>
                                            <option value="Blue">Blue (Pemula)</option>
                                            <option value="Silver">Silver (Mandiri)</option>
                                            <option value="Gold">Gold (Mapan)</option>
                                            <option value="Platinum">Platinum (Ekspor)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>

            <div className={styles.formFooter}>
                <a href="/admin/permits" className={styles.cancelBtn}>Batal</a>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan SK'}
                </button>
            </div>
        </form>
    );
}
