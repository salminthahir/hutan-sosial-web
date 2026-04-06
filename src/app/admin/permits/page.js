'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/adminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import styles from './permits.module.css';

export default function AdminPermitsPage() {
    const { authFetch, user } = useAuth();
    const [permits, setPermits] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const fetchPermits = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15 });
            if (search) params.append('search', search);
            const data = await authFetch(`/api/admin/permits?${params.toString()}`);
            setPermits(data.data || []);
            setMeta(data.meta || {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [authFetch, page, search]);

    useEffect(() => { fetchPermits(); }, [fetchPermits]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchPermits();
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus SK ini? Data tidak dapat dikembalikan.')) return;
        
        try {
            await authFetch(`/api/admin/permits/${id}`, { method: 'DELETE' });
            fetchPermits(); // Reload data
        } catch (e) {
            alert(e.message || 'Gagal menghapus SK');
        }
    };

    return (
        <AdminLayout>
            <div className={styles.page}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Kelola SK</h1>
                        <p className={styles.pageSubtitle}>
                            {user?.regency?.name || 'Semua Kabupaten'} — {meta.total} SK
                        </p>
                    </div>
                    <a href="/admin/permits/create" className={styles.createBtn}>
                        + Tambah SK
                    </a>
                </div>

                <form onSubmit={handleSearch} className={styles.searchBar}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nomor SK atau nama lembaga..."
                        className={styles.searchInput}
                    />
                </form>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No. SK</th>
                                <th>Lembaga</th>
                                <th>Skema</th>
                                <th>Kabupaten</th>
                                <th>Luas (Ha)</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className={styles.emptyState}>Memuat data...</td></tr>
                            ) : permits.length === 0 ? (
                                <tr><td colSpan={7} className={styles.emptyState}>Tidak ada data ditemukan</td></tr>
                            ) : permits.map(p => (
                                <tr key={p.id}>
                                    <td className={styles.permitNumber}>{p.permitNumber || '-'}</td>
                                    <td>{p.institution?.shortName || p.institution?.fullName || '-'}</td>
                                    <td><span className={styles.badge}>{p.scheme?.code || '-'}</span></td>
                                    <td>{p.village?.district?.regency?.name || '-'}</td>
                                    <td>{parseFloat(p.areaPermitted || 0).toLocaleString('id-ID')}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${p.permitStatus === 'Izin' ? styles.statusActive : styles.statusProcess}`}>
                                            {p.permitStatus || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actionGroup}>
                                            <a href={`/admin/permits/${p.id}/edit`} className={styles.editBtn}>
                                                Edit
                                            </a>
                                            <button onClick={() => handleDelete(p.id)} className={styles.deleteBtn}>
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {meta.totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className={styles.pageBtn}>
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <span className={styles.pageInfo}>Halaman {meta.page} dari {meta.totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className={styles.pageBtn}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
