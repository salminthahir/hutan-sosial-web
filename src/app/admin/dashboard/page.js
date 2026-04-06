'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/adminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { FileText, Building2, MapPin, Users, TrendingUp } from 'lucide-react';
import styles from './dashboard.module.css';

export default function AdminDashboardPage() {
    const { authFetch, user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [regencies, setRegencies] = useState([]);
    const [selectedRegency, setSelectedRegency] = useState('');

    useEffect(() => {
        if (user?.role === 'superadmin') {
            (async () => {
                try {
                    const res = await authFetch('/api/admin/reference/regencies');
                    if (res.success) setRegencies(res.data);
                } catch (e) {
                    console.error('Initial regency load error:', e);
                }
            })();
        }
    }, [user, authFetch]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const url = selectedRegency 
                    ? `/api/admin/dashboard?regencyId=${selectedRegency}` 
                    : '/api/admin/dashboard';
                const data = await authFetch(url);
                setStats(data.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [authFetch, selectedRegency]);

    return (
        <AdminLayout>
            <div className={styles.page}>
                <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className={styles.pageTitle}>Dashboard</h1>
                        <p className={styles.pageSubtitle}>
                            {user?.role === 'superadmin' 
                                ? (selectedRegency ? `Filter Aktif: ${regencies.find(r => r.id.toString() === selectedRegency)?.name || ''}` : 'Data Perhutanan Sosial — Seluruh Maluku Utara')
                                : (user?.regency?.name ? `Data Perhutanan Sosial — ${user.regency.name}` : '')
                            }
                        </p>
                    </div>

                    {user?.role === 'superadmin' && (
                        <div>
                            <select 
                                value={selectedRegency}
                                onChange={(e) => setSelectedRegency(e.target.value)}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', background: 'white' }}
                            >
                                <option value="">Keseluruhan (Provinsi)</option>
                                {regencies.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className={styles.loading}>Memuat data...</div>
                ) : stats ? (
                    <div className={styles.grid}>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                                <FileText size={22} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{(stats.totalPermits || 0).toLocaleString('id-ID')}</span>
                                <span className={styles.statLabel}>Total SK</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconBrown}`}>
                                <MapPin size={22} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{parseFloat(stats.totalArea || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                                <span className={styles.statLabel}>Total Luas (Ha)</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                                <Building2 size={22} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{(stats.totalInstitutions || 0).toLocaleString('id-ID')}</span>
                                <span className={styles.statLabel}>Total Lembaga</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                                <Users size={22} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{(stats.totalHouseholds || 0).toLocaleString('id-ID')}</span>
                                <span className={styles.statLabel}>Total KK</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconTeal}`}>
                                <TrendingUp size={22} />
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statValue}>{(stats.totalMembers || 0).toLocaleString('id-ID')}</span>
                                <span className={styles.statLabel}>Total Anggota</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p>Tidak dapat memuat data</p>
                )}

                <div className={styles.infoCard}>
                    <h3 className={styles.infoTitle}>Informasi Akun</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Username</span>
                            <span className={styles.infoValue}>{user?.username}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Email</span>
                            <span className={styles.infoValue}>{user?.email}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Role</span>
                            <span className={styles.infoValue}>{user?.role}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Wilayah</span>
                            <span className={styles.infoValue}>{user?.regency?.name || 'Semua Kabupaten'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
