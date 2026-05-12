import styles from './page.module.css';
import Skeleton from '@/components/ui/Skeleton';
import { ChevronLeft } from 'lucide-react';

export default function PermitDetailSkeleton() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.mapWrapper}>
                    <Skeleton width="100%" height="100%" />
                    <div className={styles.mapOverlay} />
                    <button className={styles.backBtn} disabled>
                        <ChevronLeft size={24} />
                    </button>
                    <div className={styles.titleContainer}>
                        <Skeleton width="60%" height="32px" style={{ marginBottom: '8px' }} />
                        <Skeleton width="120px" height="24px" borderRadius="12px" />
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {/* Tab Bar Skeleton */}
                <div style={{ display: 'flex', gap: '8px', padding: '16px', overflowX: 'hidden' }}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} width="80px" height="32px" borderRadius="16px" />
                    ))}
                </div>
                
                <div className={styles.tabContent}>
                    {/* Info Tab Skeleton */}
                    <div className={styles.infoTab}>
                        <div className={styles.sectionHeader}>
                            <Skeleton width="24px" height="24px" borderRadius="4px" />
                            <Skeleton width="120px" height="20px" />
                        </div>
                        <div className={styles.card}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={styles.detailRow}>
                                    <Skeleton width="100px" height="16px" />
                                    <Skeleton width="150px" height="16px" />
                                </div>
                            ))}
                        </div>

                        <div className={styles.sectionHeader} style={{ marginTop: '24px' }}>
                            <Skeleton width="24px" height="24px" borderRadius="4px" />
                            <Skeleton width="120px" height="20px" />
                        </div>
                        <div className={styles.card}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className={styles.detailRow}>
                                    <Skeleton width="100px" height="16px" />
                                    <Skeleton width="150px" height="16px" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
