'use client';
import { useAuth } from '@/lib/adminAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, LayoutDashboard, FileText, Users, Building2, ChevronLeft, Menu } from 'lucide-react';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar on route change on mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className={styles.loadingScreen}><div className={styles.spinner} /></div>;
    }

    if (!user) return null;

    const navItems = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/permits', label: 'Kelola SK', icon: FileText },
        { href: '/admin/institutions', label: 'Lembaga', icon: Building2 },
    ];

    if (user.role === 'superadmin') {
        navItems.push({ href: '/admin/users', label: 'Kelola User', icon: Users });
    }

    return (
        <div className={styles.container}>
            {/* Overlay for mobile backdrop */}
            <div 
                className={`${styles.overlay} ${isSidebarOpen ? styles.overlayOpen : ''}`} 
                onClick={() => setIsSidebarOpen(false)}
            />

            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.sidebarTitle}>Admin Panel</h2>
                    <p className={styles.sidebarSubtitle}>
                        {user.regency?.name || 'Semua Kabupaten'}
                    </p>
                </div>

                <nav className={styles.nav}>
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </a>
                        );
                    })}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.username}</span>
                        <span className={styles.userRole}>{user.role}</span>
                    </div>
                    <button className={styles.logoutBtn} onClick={() => { logout(); router.push('/admin/login'); }}>
                        <LogOut size={16} />
                    </button>
                </div>

                <a href="/" className={styles.backLink}>
                    <ChevronLeft size={14} />
                    <span>Kembali ke Beranda</span>
                </a>
            </aside>

            <main className={styles.main}>
                <button 
                    className={styles.hamburgerBtn} 
                    onClick={() => setIsSidebarOpen(true)}
                    type="button"
                    aria-label="Open Menu"
                >
                    <Menu size={28} />
                </button>
                {children}
            </main>
        </div>
    );
}
