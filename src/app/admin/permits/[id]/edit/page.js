'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/adminAuth';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import PermitForm from '@/components/admin/PermitForm';

export default function EditPermitPage() {
    const { authFetch, user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [submitting, setSubmitting] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!params.id) return;
        
        async function fetchPermit() {
            try {
                const res = await authFetch(`/api/admin/permits/${params.id}`);
                if (res.success && res.data) {
                    setInitialData(res.data);
                } else {
                    setError('Data SK tidak valid atau tidak ditemukan.');
                }
            } catch (err) {
                console.error(err);
                setError('SK tidak ditemukan atau Anda tidak memiliki akses.');
            }
        }
        
        fetchPermit();
    }, [authFetch, params.id]);

    const handleSubmit = async (formData) => {
        setSubmitting(true);
        try {
            await authFetch(`/api/admin/permits/${params.id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            alert('Perubahan SK berhasil disimpan.');
            router.push('/admin/permits');
        } catch (err) {
            alert(err.message || 'Gagal menyimpan perubahan');
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>
                        Edit Data SK
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                        {user?.regency?.name ? `Memperbarui SK wilayah ${user.regency.name}` : 'Memperbarui SK perhutanan sosial'}
                    </p>
                </div>

                {error ? (
                    <div style={{ padding: '24px', background: '#ffebee', color: '#c62828', borderRadius: '8px', border: '1px solid #ffcdd2' }}>
                        <strong>Akses Ditolak:</strong> {error}
                        <br/><br/>
                        <button onClick={() => router.push('/admin/permits')} style={{ padding: '8px 16px', background: 'white', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>
                            Kembali
                        </button>
                    </div>
                ) : !initialData ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        Memuat data...
                    </div>
                ) : (
                    <PermitForm initialData={initialData} onSubmit={handleSubmit} loading={submitting} />
                )}
            </div>
        </AdminLayout>
    );
}
