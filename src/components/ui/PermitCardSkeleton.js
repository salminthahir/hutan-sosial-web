import styles from './PermitCard.module.css';
import Skeleton from './Skeleton';

export default function PermitCardSkeleton() {
    return (
        <div className={styles.card}>
            <div className={styles.link}>
                <div className={styles.content}>
                    <div className={styles.header}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Skeleton width="90%" height="20px" />
                            <Skeleton width="60%" height="20px" />
                        </div>
                        <Skeleton width="48px" height="24px" borderRadius="6px" />
                    </div>

                    <div className={styles.location}>
                        <Skeleton width="16px" height="16px" borderRadius="50%" />
                        <Skeleton width="80%" height="16px" />
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.area} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Skeleton width="16px" height="16px" borderRadius="50%" />
                            <Skeleton width="60px" height="16px" />
                        </div>
                        <Skeleton width="70px" height="24px" borderRadius="20px" />
                    </div>
                </div>
            </div>
        </div>
    );
}
