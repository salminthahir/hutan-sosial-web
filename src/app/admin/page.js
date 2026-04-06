'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/adminAuth';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            router.push(user ? '/admin/dashboard' : '/admin/login');
        }
    }, [user, loading, router]);

    return null;
}
