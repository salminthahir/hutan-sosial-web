'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function ClientLayoutWrapper({ children }) {
    const pathname = usePathname();
    const isAdmin = pathname && (pathname.startsWith('/admin') || pathname.startsWith('/login'));

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <div className="app-container">
            <Navigation />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
