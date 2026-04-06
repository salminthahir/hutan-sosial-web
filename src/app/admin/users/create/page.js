'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/adminAuth';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from '../users.module.css';

export default function CreateUserPage() {
    const { authFetch, user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [regencies, setRegencies] = useState([]);
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'admin',
        regencyId: ''
    });

    useEffect(() => {
        // Redirection if not superadmin
        if (user && user.role !== 'superadmin') {
            router.push('/admin/dashboard');
        }

        // Fetch regencies for dropdown
        async function fetchRegencies() {
            try {
                const res = await authFetch('/api/admin/reference/regencies');
                if (res.success) {
                    setRegencies(res.data);
                }
            } catch (error) {
                console.error('Gagal memuat kabupaten', error);
            }
        }
        
        if (user?.role === 'superadmin') {
            fetchRegencies();
        }
    }, [user, router, authFetch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authFetch('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            alert('User admin berhasil dibuat!');
            router.push('/admin/users');
        } catch (error) {
            alert(error.message || 'Gagal membuat user admin');
            setLoading(false);
        }
    };

    if (user?.role !== 'superadmin') return null;

    return (
        <AdminLayout>
            <div className={styles.page} style={{ maxWidth: '600px' }}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Tambah Admin Baru</h1>
                        <p className={styles.pageSubtitle}>Daftarkan akun admin dinas atau superadmin baru</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.formCard} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div className={styles.fieldGroup} style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px' }}>Username *</label>
                        <input
                            type="text"
                            name="username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Contoh: admin_halbar"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                        />
                    </div>

                    <div className={styles.fieldGroup} style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px' }}>Email *</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Contoh: dinas@halbar.go.id"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                        />
                    </div>

                    <div className={styles.fieldGroup} style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px' }}>Password *</label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Minimal 6 karakter"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                        />
                    </div>

                    <div className={styles.fieldGroup} style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px' }}>Role/Hak Akses *</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white' }}
                        >
                            <option value="admin">Admin Kabupaten (Terbatas)</option>
                            <option value="superadmin">Superadmin (Akses Penuh Seluruh Malut)</option>
                        </select>
                    </div>

                    {formData.role === 'admin' && (
                        <div className={styles.fieldGroup} style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px' }}>Tugaskan ke Kabupaten/Kota *</label>
                            <select
                                name="regencyId"
                                required={formData.role === 'admin'}
                                value={formData.regencyId}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white' }}
                            >
                                <option value="">-- Pilih Kabupaten/Kota --</option>
                                {regencies.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <a href="/admin/users" style={{ padding: '10px 20px', borderRadius: '8px', color: '#666', border: '1px solid #ddd', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                            Batal
                        </a>
                        <button type="submit" disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', color: 'white', background: '#2e7d32', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>
                            {loading ? 'Menyimpan...' : 'Simpan Akun'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
