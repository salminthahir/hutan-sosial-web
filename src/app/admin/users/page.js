'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/adminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserPlus, Shield, ShieldCheck, MapPin, Check, X } from 'lucide-react';
import styles from './users.module.css';

export default function AdminUsersPage() {
    const { authFetch, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        try {
            const data = await authFetch('/api/admin/users');
            setUsers(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const toggleActive = async (id, currentActive) => {
        try {
            await authFetch(`/api/admin/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: !currentActive })
            });
            fetchUsers();
        } catch (e) {
            alert(e.message);
        }
    };

    if (user?.role !== 'superadmin') {
        return (
            <AdminLayout>
                <div className={styles.page}>
                    <p style={{ color: '#999', textAlign: 'center', marginTop: 60 }}>
                        Anda tidak memiliki akses ke halaman ini
                    </p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className={styles.page}>
                <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 className={styles.pageTitle}>Kelola User Admin</h1>
                        <p className={styles.pageSubtitle}>Akun admin per kabupaten/kota</p>
                    </div>
                    <a href="/admin/users/create" style={{ background: '#2e7d32', color: 'white', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 8px rgba(46,125,50,0.2)' }}>
                        + Tambah Admin
                    </a>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Wilayah</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className={styles.emptyState}>Memuat data...</td></tr>
                            ) : users.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={`${styles.avatar} ${u.role === 'superadmin' ? styles.avatarSuper : styles.avatarAdmin}`}>
                                                {u.role === 'superadmin' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                                            </div>
                                            <span className={styles.username}>{u.username}</span>
                                        </div>
                                    </td>
                                    <td className={styles.email}>{u.email}</td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${u.role === 'superadmin' ? styles.roleSuperadmin : styles.roleAdmin}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        {u.regency ? (
                                            <span className={styles.regencyTag}>
                                                <MapPin size={12} />
                                                {u.regency.name}
                                            </span>
                                        ) : (
                                            <span className={styles.allRegency}>Semua</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusDot} ${u.isActive ? styles.statusActive : styles.statusInactive}`}>
                                            {u.isActive ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td>
                                        {u.id !== user.id && u.role !== 'superadmin' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className={`${styles.toggleBtn} ${u.isActive ? styles.toggleDeactivate : styles.toggleActivate}`}
                                                    onClick={() => toggleActive(u.id, u.isActive)}
                                                >
                                                    {u.isActive ? <><X size={12}/> Nonaktifkan</> : <><Check size={12}/> Aktifkan</>}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const newPass = prompt(`Reset password untuk ${u.username}? Masukkan password baru (min 6 karakter):`);
                                                        if (newPass && newPass.length >= 6) {
                                                            try {
                                                                await authFetch(`/api/admin/users/${u.id}`, {
                                                                    method: 'PUT',
                                                                    body: JSON.stringify({ password: newPass })
                                                                });
                                                                alert('Password berhasil di-reset!');
                                                            } catch (e) { alert(e.message || 'Gagal reset password'); }
                                                        } else if (newPass) {
                                                            alert('Password minimal 6 karakter!');
                                                        }
                                                    }}
                                                    style={{ padding: '6px 12px', background: '#e3f2fd', color: '#1565c0', border: '1px solid transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}
                                                >
                                                    Reset Password
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
