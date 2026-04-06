'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/adminAuth';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import PermitForm from '@/components/admin/PermitForm';

export default function CreatePermitPage() {
    const { authFetch, user } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (formData) => {
        setSubmitting(true);
        try {
            await authFetch('/api/admin/permits', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            alert('SK berhasil ditambahkan.');
            router.push('/admin/permits');
        } catch (error) {
            alert(error.message || 'Gagal menyimpan SK');
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>
                        Tambah SK Baru
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                        {user?.regency?.name ? `Menambahkan SK untuk wilayah ${user.regency.name}` : 'Menambahkan SK perhutanan sosial'}
                    </p>
                </div>

                <PermitForm onSubmit={handleSubmit} loading={submitting} />
            </div>
        </AdminLayout>
    );
}
