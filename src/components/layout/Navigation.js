'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Search, Map as MapIcon, BarChart2, LogIn } from 'lucide-react';
import styles from './Navigation.module.css';

export default function Navigation() {
    const pathname = usePathname();

    // Do not render this sidebar on admin pages
    if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/login'))) {
        return null;
    }

    const navItems = [
        { name: 'Beranda', href: '/', icon: Home },
        { name: 'Jelajahi', href: '/search', icon: Search },
        { name: 'Peta', href: '/map', icon: MapIcon },
        { name: 'Prioritas', href: '/priority', icon: BarChart2 },
    ];

    return (
        <nav className={styles.nav}>
            <div className={styles.brandContainer}>
                <Image src="/images/logo/Logo_Malut.svg" alt="Logo" width={40} height={40} className={styles.logoImage} />
                <div className={styles.brandTitle}>Hutan Sosial</div>
            </div>
            <ul className={styles.navList}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Simple exact match or start with path match for nested routes
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <li key={item.name} className={styles.navItem}>
                            <Link
                                href={item.href}
                                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                            >
                                <Icon className={styles.icon} size={24} />
                                <span className={styles.label}>{item.name}</span>
                            </Link>
                        </li>
                    );
                })}

                {/* Admin Panel as part of the nav list but separated at the bottom */}
                <li key="AdminPanel" className={`${styles.navItem} ${styles.adminNavItem}`}>
                    <Link
                        href="/admin/login"
                        className={styles.navLink}
                    >
                        <LogIn className={styles.icon} size={24} />
                        <span className={styles.label}>Admin Panel</span>
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
