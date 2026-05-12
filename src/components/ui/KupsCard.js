'use client';

import Link from 'next/link';
import { MapPin, User, Leaf, Trees, Users, CalendarDays } from 'lucide-react';
import styles from './KupsCard.module.css';

/**
 * Badge class mapping for business class
 */
const BADGE_CLASS = {
    Silver: styles.badgeSilver,
    Gold: styles.badgeGold,
    Blue: styles.badgeBlue,
    Platinum: styles.badgePlatinum,
};

/**
 * Determine cluster tag style based on cluster name
 */
function getClusterTagStyle(cluster) {
    if (!cluster) return styles.tagClusterDefault;
    const c = cluster.toLowerCase();
    if (c.includes('agroforestry') || c.includes('hutan')) return styles.tagClusterForest;
    if (c.includes('ekowisata')) return styles.tagClusterTourism;
    return styles.tagClusterDefault;
}

export default function KupsCard({ kups }) {
    const permit = kups.permit;
    const hasPermit = permit && permit.id;

    // Build location string
    const locationParts = [permit?.village, permit?.district, permit?.regency].filter(Boolean);
    const locationStr = locationParts.length > 0
        ? locationParts.join(', ')
        : (kups.address || null);

    const href = hasPermit ? `/permit/${permit.id}?tab=pasar` : null;
    const Wrapper = href ? Link : 'div';

    const wrapperProps = href
        ? { href, className: styles.cardLink }
        : { className: styles.cardLink };

    return (
        <div className={styles.card}>
            <Wrapper {...wrapperProps}>
                {/* Header: Name + Badge */}
                <div className={styles.header}>
                    <h3 className={styles.name}>{kups.name}</h3>
                    <span className={`${styles.badge} ${BADGE_CLASS[kups.businessClass] || BADGE_CLASS.Silver}`}>
                        {kups.businessClass || 'Silver'}
                    </span>
                </div>

                {/* Location */}
                {locationStr && (
                    <div className={styles.infoRow}>
                        <MapPin size={16} className={styles.infoIcon} />
                        <span>{locationStr}</span>
                    </div>
                )}

                {/* Chairman */}
                <div className={styles.infoRow}>
                    <User size={16} className={styles.infoIcon} />
                    <span>
                        <span className={styles.infoLabel}>Ketua: </span>
                        <span className={styles.infoValue}>{kups.chairmanName || '-'}</span>
                    </span>
                </div>

                {/* Commodities */}
                {kups.commodities && (
                    <div className={styles.infoRow}>
                        <Leaf size={16} className={styles.infoIcon} />
                        <span>
                            <span className={styles.infoLabel}>Komoditas: </span>
                            <span className={styles.infoValue}>{kups.commodities}</span>
                        </span>
                    </div>
                )}

                <hr className={styles.divider} />

                {/* Detail Grid: Ketua + Klaster */}
                <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Klaster</span>
                        <span className={styles.detailValue}>{kups.cluster || '-'}</span>
                    </div>
                    {kups.totalMembers && (
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Anggota</span>
                            <span className={styles.detailValue}>{kups.totalMembers} orang</span>
                        </div>
                    )}
                    {kups.skNumber && (
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>No. SK</span>
                            <span className={styles.detailValue}>{kups.skNumber}</span>
                        </div>
                    )}
                    {kups.establishedYear && (
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Tahun Berdiri</span>
                            <span className={styles.detailValue}>{kups.establishedYear}</span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div className={styles.tags}>
                    {kups.cluster && kups.cluster !== '-' && (
                        <span className={`${styles.tag} ${getClusterTagStyle(kups.cluster)}`}>
                            {kups.cluster}
                        </span>
                    )}
                    {kups.totalMembers && (
                        <span className={`${styles.tag} ${styles.tagMembers}`}>
                            {kups.totalMembers} Anggota
                        </span>
                    )}
                    {kups.establishedYear && (
                        <span className={`${styles.tag} ${styles.tagYear}`}>
                            Est. {kups.establishedYear}
                        </span>
                    )}
                </div>

                {/* Action Button */}
                <div className={styles.actionArea}>
                    {hasPermit ? (
                        <button className={styles.actionBtn} type="button">
                            Lihat Detail
                        </button>
                    ) : (
                        <div className={styles.actionBtnDisabled}>
                            Permit belum ter-link
                        </div>
                    )}
                </div>
            </Wrapper>
        </div>
    );
}