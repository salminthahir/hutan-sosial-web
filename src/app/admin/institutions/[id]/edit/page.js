"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/adminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import InstitutionForm from '@/components/admin/InstitutionForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';

export default function EditInstitutionPage({ params }) {
    const { id } = use(params);
    const { authFetch } = useAuth();
    const router = useRouter();

    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInst = async () => {
            try {
                const res = await authFetch(`/api/admin/institutions/${id}`);
                if (res.success) {
                    setInstitution(res.data);
                } else {
                    setError(res.message);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInst();
    }, [id, authFetch]);

    const handleSubmit = async (formData) => {
        try {
            const res = await authFetch(`/api/admin/institutions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.success) {
                alert('Lembaga berhasil diperbarui!');
                router.push('/admin/institutions');
            } else {
                alert('Gagal menyimpan: ' + res.message);
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan server.');
        }
    };

    if (loading) return <div style={{ display: 'flex', height: '50vh', justifyContent: 'center', alignItems: 'center' }}><LoadingSpinner /></div>;
    if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
    if (!institution) return <ErrorState message="Lembaga tidak ditemukan" />;

    return (
        <AdminLayout>
            <InstitutionForm initialData={institution} isEdit={true} onSubmit={handleSubmit} />
        </AdminLayout>
    );
}
