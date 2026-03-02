import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, MapPin, FileText, Users, Checklist, ExternalLink, Leaf, Download } from 'lucide-react';
import { getCommodityIconOptions, getCommodityAssetPath } from '@/lib/commodityIcons';
import { parsePermitName } from '@/lib/utils';
import styles from './PermitSummaryModal.module.css';

export default function PermitSummaryModal({ permit, onClose }) {
    const router = useRouter();

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    if (!permit) return null;

    const handleBackdropClick = (e) => {
        if (e.target.className === styles.overlay) onClose();
    };

    const statusColor = permit.status === 'Izin' ? '#4CAF50' : '#FF9800';

    const hasSkFisik = permit.badges?.some(b => b.label === 'SK Fisik') || false;
    const hasPdfDoc = permit.hasPdfDoc || false;
    const hasCoords = permit.hasCoords;

    const { title, badge } = permit ? parsePermitName(permit.name) : { title: '', badge: '' };
    const displayBadge = badge || permit?.scheme;

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                <div className={styles.dragHandle} />
                <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
                    <X size={20} />
                </button>

                <header className={styles.headerRow}>
                    {displayBadge && <div className={styles.schemeBadge}>{displayBadge}</div>}
                    <div style={{ flex: 1 }}>
                        <h2 className={styles.title}>{title}</h2>
                        <div className={styles.statusRow} style={{ color: statusColor }}>
                            <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
                            {permit.status === 'Izin' ? 'Izin Aktif' : 'Dalam Proses'}
                        </div>
                    </div>
                </header>

                <div className={styles.locationBox}>
                    <MapPin size={20} className={styles.locIcon} />
                    <div className={styles.locText}>
                        <div className={styles.locVillage}>Desa {permit.location?.village || '-'}</div>
                        <div className={styles.locSub}>Kec. {permit.location?.district || '-'}, Kab. {permit.location?.regency || '-'}</div>
                        <div className={styles.locSub}>{permit.location?.province || '-'}</div>
                    </div>
                </div>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}><FileText size={18} color="#666" /> Info SK</div>
                    <div className={styles.infoBox}>
                        <div className={styles.infoRow}><span className={styles.infoLabel}>No. SK</span> <span className={styles.infoValue}>: {permit.permitNumber || '-'}</span></div>
                        <div className={styles.infoRow}><span className={styles.infoLabel}>Tahun</span> <span className={styles.infoValue}>: {permit.permitYear || '-'}</span></div>
                        <div className={styles.infoRow}><span className={styles.infoLabel}>Luas Area</span> <span className={styles.infoValue}>: {permit.area ? permit.area.toFixed(2) : '0'} Ha</span></div>
                        <div className={styles.infoRow}><span className={styles.infoLabel}>Status</span> <span className={styles.infoValue} style={{ color: statusColor }}>: {permit.status}</span></div>
                    </div>
                </section>

                {permit.commodities && permit.commodities.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}><Leaf size={18} color="#666" /> Komoditas ({permit.commodities.length})</div>
                        <div className={styles.commodityGrid}>
                            {permit.commodities.map((c, i) => {
                                const iconData = getCommodityIconOptions(c.name);
                                const assetPath = getCommodityAssetPath(iconData.assetName);
                                return (
                                    <div key={i} className={styles.commodityChip} style={{ backgroundColor: `${iconData.color}15`, borderColor: c.isPrimary ? iconData.color : `${iconData.color}33`, borderWidth: c.isPrimary ? '1.5px' : '1px' }}>
                                        <div className={styles.commodityIconWrapper}>
                                            <span className={styles.commodityEmojiFallback} aria-hidden="true">{iconData.emoji}</span>
                                            {iconData.assetName && (
                                                <Image
                                                    src={assetPath}
                                                    alt={c.name}
                                                    width={36}
                                                    height={36}
                                                    className={styles.commodityImage}
                                                />
                                            )}
                                        </div>
                                        <span style={{ color: iconData.color, fontWeight: c.isPrimary ? 700 : 500, fontSize: '0.65rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                            {c.name.length > 8 ? `${c.name.substring(0, 7)}…` : c.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className={styles.section}>
                    <div className={styles.sectionTitle}><Users size={18} color="#666" /> Kelembagaan</div>
                    <div className={styles.infoBox}>
                        <div className={styles.infoRow}><span className={styles.infoLabel}>Anggota</span> <span className={styles.infoValue}>: {permit.members || 0} orang</span></div>
                        <div className={styles.infoRow}><span className={styles.infoLabel}>Jml KK</span> <span className={styles.infoValue}>: {permit.households || 0} KK</span></div>
                        {permit.type && <div className={styles.infoRow}><span className={styles.infoLabel}>Tipe</span> <span className={styles.infoValue}>: {permit.type}</span></div>}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}><FileText size={18} color="#666" /> Dokumen</div>
                    <div className={styles.docChecklist}>
                        <div className={`${styles.docBadge} ${hasSkFisik ? styles.docYes : styles.docNo}`}>
                            {hasSkFisik ? '✓' : '×'} SK Fisik
                        </div>
                        <div className={`${styles.docBadge} ${hasPdfDoc ? styles.docYes : styles.docNo}`}>
                            {hasPdfDoc ? '✓' : '×'} SK PDF
                        </div>
                        <div className={`${styles.docBadge} ${hasCoords ? styles.docYes : styles.docNo}`}>
                            {hasCoords ? '✓' : '×'} Koordinat
                        </div>
                        <div className={`${styles.docBadge} ${hasCoords ? styles.docYes : styles.docNo}`}>
                            {hasCoords ? '✓' : '×'} Peta Area
                        </div>
                    </div>

                    <div className={styles.docChecklist} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {permit.pdfUrl ? (
                            <button
                                className={styles.downloadBtn}
                                onClick={() => window.open(permit.pdfUrl, '_blank')}
                            >
                                <Download size={16} /> UNDUH SK PDF
                            </button>
                        ) : (
                            <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>Dokumen belum tersedia untuk diunduh.</span>
                        )}
                    </div>
                </section>

                <button className={styles.detailBtn} onClick={() => router.push(`/permit/${permit.id}`)}>
                    <ExternalLink size={18} /> LIHAT DETAIL LENGKAP
                </button>
            </div>
        </div>
    );
}
