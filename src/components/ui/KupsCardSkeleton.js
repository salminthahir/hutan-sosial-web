import styles from './KupsCard.module.css';
import Skeleton from './Skeleton';

export default function KupsCardSkeleton() {
    return (
        <div className={styles.card}>
            <div className={styles.cardLink}>
                {/* Header: Name + Badge */}
                <div className={styles.header}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Skeleton width="80%" height="22px" />
                        <Skeleton width="50%" height="22px" />
                    </div>
                    <Skeleton width="60px" height="24px" borderRadius="12px" />
                </div>

                {/* Location */}
                <div className={styles.infoRow}>
                    <Skeleton width="16px" height="16px" borderRadius="50%" />
                    <Skeleton width="75%" height="16px" />
                </div>

                {/* Chairman */}
                <div className={styles.infoRow}>
                    <Skeleton width="16px" height="16px" borderRadius="50%" />
                    <Skeleton width="60%" height="16px" />
                </div>

                {/* Commodities */}
                <div className={styles.infoRow}>
                    <Skeleton width="16px" height="16px" borderRadius="50%" />
                    <Skeleton width="85%" height="16px" />
                </div>

                <hr className={styles.divider} />

                {/* Detail Grid */}
                <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                        <Skeleton width="40px" height="12px" style={{ marginBottom: '4px' }} />
                        <Skeleton width="80px" height="16px" />
                    </div>
                    <div className={styles.detailItem}>
                        <Skeleton width="50px" height="12px" style={{ marginBottom: '4px' }} />
                        <Skeleton width="70px" height="16px" />
                    </div>
                    <div className={styles.detailItem}>
                        <Skeleton width="45px" height="12px" style={{ marginBottom: '4px' }} />
                        <Skeleton width="90px" height="16px" />
                    </div>
                    <div className={styles.detailItem}>
                        <Skeleton width="60px" height="12px" style={{ marginBottom: '4px' }} />
                        <Skeleton width="60px" height="16px" />
                    </div>
                </div>

                {/* Tags */}
                <div className={styles.tags}>
                    <Skeleton width="80px" height="24px" borderRadius="12px" />
                    <Skeleton width="90px" height="24px" borderRadius="12px" />
                    <Skeleton width="70px" height="24px" borderRadius="12px" />
                </div>

                {/* Action Button */}
                <div className={styles.actionArea}>
                    <Skeleton width="100%" height="36px" borderRadius="8px" />
                </div>
            </div>
        </div>
    );
}
