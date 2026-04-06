"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/adminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import InstitutionForm from '@/components/admin/InstitutionForm';

export default function CreateInstitutionPage() {
    const { authFetch } = useAuth();
    const router = useRouter();

    const handleSubmit = async (formData) => {
        try {
            const res = await authFetch('/api/admin/institutions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.success) {
                alert('Lembaga berhasil ditambahkan!');
                router.push('/admin/institutions');
            } else {
                alert('Gagal menyimpan: ' + res.message);
            }
        } catch (error) {
            console.error(error);
            alert('Kesalahan server saat menyimpan Lembaga.');
        }
    };

    return (
        <AdminLayout>
            <InstitutionForm isEdit={false} onSubmit={handleSubmit} />
        </AdminLayout>
    );
}
