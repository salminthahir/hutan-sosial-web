'use client';
import { AdminAuthProvider } from '@/lib/adminAuth';

export default function AdminRootLayout({ children }) {
    return (
        <AdminAuthProvider>
            {children}
        </AdminAuthProvider>
    );
}
