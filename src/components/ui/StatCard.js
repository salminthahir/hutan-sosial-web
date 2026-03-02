import styles from './StatCard.module.css';

export default function StatCard({ title, value, icon: Icon, colorClass, onClick, active }) {
    return (
        <div
            className={`${styles.card} ${styles[colorClass]} ${active ? styles.active : ''} ${onClick ? styles.clickable : ''}`}
            onClick={onClick}
        >
            <div className={styles.iconWrapper}>
                <Icon size={24} />
            </div>
            <div className={styles.content}>
                <div className={styles.value}>{value}</div>
                <div className={styles.title}>{title}</div>
            </div>
        </div>
    );
}
