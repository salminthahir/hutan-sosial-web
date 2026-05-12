import styles from './page.module.css';
import Skeleton from '@/components/ui/Skeleton';

export default function DashboardSkeleton() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.logoTitleWrapper}>
                        <Skeleton width="32px" height="32px" borderRadius="50%" />
                        <div>
                            <Skeleton width="150px" height="24px" style={{ marginBottom: '4px' }} />
                            <Skeleton width="100px" height="16px" />
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {/* Summary Cards */}
                <section className={styles.summarySection}>
                    <Skeleton width="100%" height="100px" borderRadius="12px" />
                    <Skeleton width="100%" height="100px" borderRadius="12px" />
                </section>

                <div className={styles.dashboardCardsGrid}>
                    <Skeleton width="100%" height="80px" borderRadius="12px" />
                    <Skeleton width="100%" height="80px" borderRadius="12px" />
                </div>

                {/* Chart Section */}
                <section className={styles.section}>
                    <Skeleton width="200px" height="24px" style={{ marginBottom: '16px' }} />
                    <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Skeleton width="160px" height="160px" borderRadius="50%" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <Skeleton width="16px" height="16px" borderRadius="4px" />
                                    <div style={{ flex: 1 }}>
                                        <Skeleton width="60%" height="16px" style={{ marginBottom: '4px' }} />
                                        <Skeleton width="90%" height="12px" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
