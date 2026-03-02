import Link from 'next/link';
import { MapPin, Mountain } from 'lucide-react';
import { parsePermitName } from '@/lib/utils';
import styles from './PermitCard.module.css';

export default function PermitCard({ permit, onClick }) {
    const getStatusColor = (status) => {
        return status === 'Izin' ? styles.statusIzin : styles.statusProses;
    };

    const { title, badge } = parsePermitName(permit.name);
    const displayBadge = badge || permit.scheme;

    const content = (
        <div className={styles.content}>
            <div className={styles.header}>
                <h3 className={styles.title} title={title}>{title}</h3>
                {displayBadge && (
                    <span className={styles.schemeBadge}>{displayBadge}</span>
                )}
            </div>

            <div className={styles.location}>
                <MapPin size={16} className={styles.icon} />
                <span className={styles.locationText}>
                    {permit.location?.village}, {permit.location?.district}, {permit.location?.regency}
                </span>
            </div>

            <div className={styles.footer}>
                <div className={styles.area}>
                    <Mountain size={16} className={styles.icon} />
                    <span>{parseFloat(permit.area).toFixed(1)} Ha</span>
                </div>
                <div className={`${styles.statusBadge} ${getStatusColor(permit.status)}`}>
                    {permit.status}
                </div>
            </div>
        </div>
    );

    if (onClick) {
        return (
            <div className={styles.card} onClick={onClick} style={{ cursor: 'pointer' }}>
                <div className={styles.link}>
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <Link href={`/permit/${permit.id}`} className={styles.link}>
                {content}
            </Link>
        </div>
    );
}
