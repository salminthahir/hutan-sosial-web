"use client";

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/adminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Search, Edit2, Trash2, Users, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';
import styles from './institutions.module.css';

export default function InstitutionsListPage() {
    const { authFetch } = useAuth();
    const router = useRouter();

    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchInstitutions = useCallback(async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page,
                limit,
                search: searchTerm
            });

            const res = await authFetch(`/api/admin/institutions?${queryParams}`);
            if (res.success) {
                setInstitutions(res.data);
                if (res.meta) setTotalPages(res.meta.totalPages);
            } else {
                throw new Error(res.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authFetch, page, limit, searchTerm]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchInstitutions();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchInstitutions]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Yakin ingin menghapus lembaga "${name}"? Data anggota dan penyuluh juga akan terhapus. Pastikan lembaga tidak sedang ditautkan pada SK tertentu.`)) {
            return;
        }
        
        try {
            const res = await authFetch(`/api/admin/institutions/${id}`, { method: 'DELETE' });
            if (res.success) {
                alert('Berhasil menghapus lembaga.');
                fetchInstitutions();
            } else {
                alert('Gagal: ' + res.message);
            }
        } catch (e) {
            console.error(e);
            alert('Terjadi kesalahan server saat menghapus.');
        }
    };

    return (
        <AdminLayout>
            <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Kelola Lembaga & Penyuluh</h1>
                    <p className={styles.subtitle}>Sistem Informasi Kelembagaan KUPS, KTH, Pendamping, dll.</p>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/admin/institutions/create" className={styles.addBtn}>
                        <Plus size={18} /> Tambah Lembaga
                    </Link>
                </div>
            </div>

            <div className={styles.searchBar}>
                <Search className={styles.searchIcon} size={18} />
                <input
                    type="text"
                    placeholder="Cari berdasarkan nama lembaga..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            {error && <ErrorState message={error} onRetry={fetchInstitutions} />}

            {!error && (
                <div className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <LoadingSpinner />
                            </div>
                        ) : institutions.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                <Users size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                <p>Belum ada data lembaga yang sesuai.</p>
                            </div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Nama Lembaga</th>
                                        <th>Ketua Pengurus</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {institutions.map(inst => (
                                        <tr key={inst.id}>
                                            <td style={{ fontWeight: '500', color: '#2e7d32' }}>
                                                {inst.fullName || inst.shortName}
                                            </td>
                                            <td>{inst.chairmanName || '-'}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${inst.isActive ? styles.statusActive : styles.statusInactive}`}>
                                                    {inst.isActive ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionCell} style={{ justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => router.push(`/admin/institutions/${inst.id}/edit`)}
                                                        className={`${styles.actionBtn} ${styles.editBtn}`}
                                                        title="Edit Lembaga"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(inst.id, inst.fullName || inst.shortName)}
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        title="Hapus Lembaga"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    {institutions.length > 0 && !loading && (
                        <div className={styles.pagination}>
                            <span className={styles.pageInfo}>Halaman {page} dari {totalPages || 1}</span>
                            <div className={styles.pageControls}>
                                <button
                                    className={styles.pageBtn}
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Sebelumnnya
                                </button>
                                <button
                                    className={styles.pageBtn}
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        </AdminLayout>
    );
}
