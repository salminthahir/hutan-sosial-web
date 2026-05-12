'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Droplets, Mountain, Layers, TreePine, Leaf, TrendingUp, Users, GraduationCap, Store, BarChart3, AlertTriangle, Shield, Factory, Settings, Map as MapIcon, Maximize2, X, ZoomIn, ZoomOut, Eye, EyeOff, Phone, UserCheck, FileText, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { getCommodityIconOptions, getCommodityAssetPath } from '@/lib/commodityIcons';
import { parsePermitName } from '@/lib/utils';
import Image from 'next/image';
import TabBar from '@/components/ui/TabBar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';
import styles from './page.module.css';
import dynamic from 'next/dynamic';

const MapPreview = dynamic(() => import('./MapPreview'), { ssr: false });
const FullscreenMap = dynamic(() => import('./FullscreenMap'), { ssr: false });

const TABS = ['Info', 'Biofisik', 'Komoditas', 'Sosial', 'Pasar', 'Risiko', 'Prioritas'];

// ============================================================
// Shared helpers
// ============================================================
function useAdvancedData(apiEndpoint) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(apiEndpoint, { cache: 'no-store' });
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                const json = await res.json();
                if (isMounted) setData(json);
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [apiEndpoint]);

    return { data, loading, error };
}

function TabLoading() {
    return <div style={{ padding: '48px', textAlign: 'center' }}><LoadingSpinner /></div>;
}

function TabEmpty({ emoji, message }) {
    return (
        <div className={styles.emptyState}>
            <span style={{ fontSize: 48 }}>{emoji}</span>
            <p>{message}</p>
        </div>
    );
}

function TabError({ message }) {
    return <div style={{ padding: '24px', color: 'var(--alert-red)', textAlign: 'center' }}>Error: {message}</div>;
}

function SectionHeader({ icon: Icon, label }) {
    return (
        <div className={styles.sectionHeader}>
            <div className={styles.sectionIconWrap}><Icon size={18} /></div>
            <span>{label}</span>
        </div>
    );
}

function ProgressBar({ value, color, height = 8 }) {
    const clamped = Math.min(Math.max(value, 0), 1);
    return (
        <div className={styles.progressTrack} style={{ height }}>
            <div className={styles.progressFill} style={{ width: `${clamped * 100}%`, backgroundColor: color }} />
        </div>
    );
}

function formatCurrency(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

// ============================================================
// Main Page
// ============================================================
export default function PermitDetail({ params }) {
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;
    const router = useRouter();
    const searchParams = useSearchParams();

    // Support deep link: /permit/123?tab=pasar → auto-open tab Pasar (index 4)
    const tabParam = searchParams.get('tab');
    const TAB_MAP = { info: 0, biofisik: 1, komoditas: 2, sosial: 3, pasar: 4, risiko: 5, prioritas: 6 };
    const initialTab = TAB_MAP[(tabParam || '').toLowerCase()] || 0;

    const [activeTab, setActiveTab] = useState(initialTab);
    const [permit, setPermit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapFullscreen, setMapFullscreen] = useState(false);

    useEffect(() => {
        const fetchPermit = async () => {
            try {
                const res = await api.getPermitDetail(id);
                setPermit(res.data || res);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPermit();
    }, [id]);

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></div>;
    if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
    if (!permit) return null;

    const { title, badge } = parsePermitName(permit.name);
    const displayBadge = badge || permit.scheme?.code || permit.scheme || '';

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.mapWrapper} onClick={() => setMapFullscreen(true)} style={{ cursor: 'pointer' }}>
                    <MapPreview location={permit.location || {}} />
                    <div className={styles.mapOverlay} />
                    <button className={styles.backBtn} onClick={(e) => { e.stopPropagation(); router.back(); }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div className={styles.mapHint}>
                        <Maximize2 size={14} />
                        <span>Ketuk untuk perbesar peta</span>
                    </div>
                    <div className={styles.titleContainer}>
                        <h1 className={styles.title}>{title}</h1>
                        {displayBadge && (
                            <span className={styles.headerBadge}>{displayBadge}</span>
                        )}
                    </div>
                </div>
            </div>

            {mapFullscreen && <FullscreenMap location={permit.location || {}} onClose={() => setMapFullscreen(false)} />}

            <div className={styles.content}>
                <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
                <div className={styles.tabContent}>
                    {activeTab === 0 && <InfoTab permit={permit} />}
                    {activeTab === 1 && <BiophysicalTab id={id} />}
                    {activeTab === 2 && <CommodityTab id={id} />}
                    {activeTab === 3 && <SocialTab id={id} />}
                    {activeTab === 4 && <MarketTab id={id} kups={permit.kups} />}
                    {activeTab === 5 && <RiskTab id={id} />}
                    {activeTab === 6 && <PriorityTab id={id} />}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Tab 0: Info
// ============================================================
function getInstitutionType(name) {
    if (!name) return '-';
    const n = name.trim();
    if (/^LD\b/i.test(n)) return 'Lembaga Desa (LD)';
    if (/^Koperasi\b/i.test(n)) return 'Koperasi';
    if (/^KTH\b/i.test(n)) return 'Kelompok Tani Hutan (KTH)';
    if (/^Poktan\b/i.test(n)) return 'Kelompok Tani (Poktan)';
    if (/^Gapoktanhut\b/i.test(n)) return 'Gabungan Kelompok Tani Hutan';
    if (/^Gapoktan\b/i.test(n)) return 'Gabungan Kelompok Tani';
    if (/^LPHD\b/i.test(n)) return 'Lembaga Pengelola Hutan Desa (LPHD)';
    if (/^LPMD\b/i.test(n)) return 'Lembaga Pemberdayaan Masyarakat Desa';
    return '-';
}

function MaskedPhone({ value }) {
    const [visible, setVisible] = useState(false);
    if (!value) return <span className={styles.detailValue}>-</span>;
    const masked = value.replace(/(\d{4})(\d+)(\d{2})/, '$1****$3');
    return (
        <div className={styles.maskedPhone}>
            <span className={styles.detailValue}>{visible ? value : masked}</span>
            <button className={styles.toggleBtn} onClick={() => setVisible(!visible)} title={visible ? 'Sembunyikan' : 'Tampilkan'}>
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
}

function InfoTab({ permit }) {
    const inst = permit.institution;
    const contacts = inst?.contacts || [];
    const ketuaContact = contacts.find(c => c.contactType === 'ketua');
    const penyuluhContact = contacts.find(c => c.contactType === 'penyuluh');
    const members = inst?.members?.[0];
    const instType = inst?.type?.name || getInstitutionType(inst?.fullName || inst?.shortName);

    // Parse penyuluh name and phone from contactValue "Nama | 0812xxxx"
    let penyuluhName = '-';
    let penyuluhPhone = null;
    if (penyuluhContact?.contactValue) {
        const parts = penyuluhContact.contactValue.split('|').map(s => s.trim());
        penyuluhName = parts[0] || '-';
        penyuluhPhone = parts[1] || null;
    }

    return (
        <div className={styles.infoTab}>
            {/* Kawasan Izin */}
            <SectionHeader icon={MapIcon} label="Kawasan Izin" />
            <div className={styles.card}>
                <DetailRow label="Skema" value={permit.scheme?.name || permit.scheme || '-'} />
                <DetailRow label="Luas Area" value={parseFloat(permit.area || 0).toFixed(1) + ' Ha'} />
                <DetailRow label="Status" value={permit.permitStatus?.name || permit.status || '-'} />
                <DetailRow label="No SK" value={permit.permitNumber || '-'} />
                <DetailRow label="Tahun" value={permit.permitYear || '-'} />
            </div>

            {/* Lokasi */}
            <SectionHeader icon={MapIcon} label="Lokasi" />
            <div className={styles.card}>
                <DetailRow label="Provinsi" value={permit.location?.province || '-'} />
                <DetailRow label="Kab/Kota" value={permit.location?.regency || '-'} />
                <DetailRow label="Kecamatan" value={permit.location?.district || '-'} />
                <DetailRow label="Desa" value={permit.location?.village || '-'} />
            </div>

            {/* Kelembagaan */}
            <SectionHeader icon={Users} label="Kelembagaan" />
            <div className={styles.card}>
                <DetailRow label="Nama Lembaga" value={inst?.fullName || inst?.shortName || '-'} />
                <DetailRow label="Tipe Lembaga" value={instType} />
                <DetailRow label="Nama Ketua" value={inst?.chairmanName || '-'} />
                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>No. HP Ketua</span>
                    <MaskedPhone value={ketuaContact?.contactValue} />
                </div>
                {members && (
                    <>
                        <DetailRow label="Jumlah Pengurus" value={members.totalMembers || '-'} />
                        <DetailRow label="Jumlah KK" value={members.totalHouseholds || '-'} />
                    </>
                )}
            </div>

            {/* Dokumen */}
            <SectionHeader icon={FileText} label="Dokumen" />
            <div className={styles.card}>
                <DetailRow label="SK Fisik" value={permit.documents?.physical ? '✔ Tersedia' : '✖ Tidak Tersedia'} />
                <DetailRow label="SK PDF" value={permit.documents?.pdf ? '✔ Tersedia' : '✖ Tidak Tersedia'} />

                {permit.documents?.pdf && (
                    <div className={styles.detailRow} style={{ marginTop: '1rem' }}>
                        <span className={styles.detailLabel}>File SK</span>
                        <div className={styles.detailValue}>
                            <button
                                className={styles.downloadBtn}
                                onClick={() => {
                                    if (permit.documents?.pdfUrl) {
                                        window.open(permit.documents.pdfUrl, '_blank');
                                    } else {
                                        alert('File PDF belum diunggah ke sistem. Silakan hubungi admin.');
                                    }
                                }}
                            >
                                <Download size={16} /> UNDUH SK
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Penyuluh */}
            <SectionHeader icon={UserCheck} label="Penyuluh" />
            <div className={styles.card}>
                <DetailRow label="Nama Penyuluh" value={penyuluhName} />
                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>No. HP Penyuluh</span>
                    <MaskedPhone value={penyuluhPhone} />
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{label}</span>
            <span className={styles.detailValue}>{value}</span>
        </div>
    );
}

// ============================================================
// Tab 1: Biofisik
// ============================================================
const LAND_COVER_COLORS = ['#2E7D32', '#66BB6A', '#AED581', '#DCE775', '#FFF176', '#FFB74D', '#FF8A65', '#A1887F'];

function BiophysicalTab({ id }) {
    const { data, loading, error } = useAdvancedData(`/api/advanced/biophysical/${id}`);
    if (loading) return <TabLoading />;
    if (error) return <TabError message={error} />;

    const profile = data?.profile;
    const landCovers = data?.landCovers || [];
    const suitabilities = data?.suitabilities || [];

    const hasData = profile || landCovers.length > 0 || suitabilities.length > 0;
    if (!hasData) return <TabEmpty emoji="🏔️" message="Data biofisik belum tersedia" />;

    return (
        <div>
            <a href="/map/biophysical" className={styles.mapLinkBtn}>
                <MapIcon size={18} /> Buka Peta Tematik Biofisik
            </a>

            {profile && (
                <>
                    <SectionHeader icon={Mountain} label="Profil Lahan" />
                    <div className={styles.quadGrid}>
                        <MetricTile icon={Droplets} iconColor="#0288D1" label="Curah Hujan"
                            value={`${parseFloat(profile.rainfallMm || 0).toFixed(0)} mm`}
                            badge={profile.rainfallCategory} badgeColor={rainfallColor(profile.rainfallCategory)} />
                        <MetricTile icon={Mountain} iconColor="#795548" label="Ketinggian"
                            value={`${parseFloat(profile.elevationM || 0).toFixed(0)} mdpl`}
                            badge={elevationCategory(parseFloat(profile.elevationM || 0))} badgeColor="#795548" />
                        <MetricTile icon={Layers} iconColor="#F9A825" label="Kelerengan"
                            value={`${parseFloat(profile.slopePercent || 0).toFixed(1)}%`}
                            badge={profile.slopeCategory} badgeColor={slopeColor(profile.slopeCategory)} />
                        <MetricTile icon={TreePine} iconColor="#2E7D32" label="Jenis Tanah"
                            value={profile.soilType || '-'} badge={null} badgeColor={null} />
                    </div>
                </>
            )}

            {landCovers.length > 0 && (
                <>
                    <SectionHeader icon={TreePine} label="Tutupan Lahan" />
                    <LandCoverCard landCovers={landCovers} />
                </>
            )}

            {suitabilities.length > 0 && (
                <>
                    <SectionHeader icon={Leaf} label="Kesesuaian Komoditas" />
                    <SuitabilityCard suitabilities={suitabilities} />
                </>
            )}
        </div>
    );
}

function rainfallColor(cat) {
    const c = (cat || '').toLowerCase();
    if (c.includes('sangat tinggi')) return '#0277BD';
    if (c.includes('tinggi')) return '#0288D1';
    if (c.includes('sedang')) return '#4FC3F7';
    return '#9E9E9E';
}

function elevationCategory(m) {
    if (m < 200) return 'Dataran Rendah';
    if (m < 700) return 'Menengah';
    return 'Pegunungan';
}

function slopeColor(cat) {
    const c = (cat || '').toLowerCase();
    if (c.includes('datar')) return '#4CAF50';
    if (c.includes('landai')) return '#F9A825';
    if (c.includes('curam')) return '#FF8F00';
    return '#C62828';
}

function MetricTile({ icon: Icon, iconColor, label, value, badge, badgeColor }) {
    return (
        <div className={styles.metricTile}>
            <div className={styles.metricLabel}><Icon size={14} color={iconColor} /> {label}</div>
            <div className={styles.metricValue}>{value}</div>
            {badge && badge !== '-' && (
                <span className={styles.metricBadge} style={{ backgroundColor: `${badgeColor}1A`, color: badgeColor }}>{badge}</span>
            )}
        </div>
    );
}

function LandCoverCard({ landCovers }) {
    const pieData = landCovers.map((lc, i) => ({
        name: lc.type?.name || lc.typeName || `Type ${i + 1}`,
        value: parseFloat(lc.coverPercentage || 0),
        area: parseFloat(lc.areaHectares || 0),
        color: LAND_COVER_COLORS[i % LAND_COVER_COLORS.length],
    }));

    return (
        <div className={styles.card}>
            <div className={styles.chartRow}>
                <div className={styles.pieWrap}>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className={styles.legendCol}>
                    {pieData.map((e, i) => (
                        <div key={i} className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ backgroundColor: e.color }} />
                            <span className={styles.legendText}>{e.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.divider} />
            {pieData.map((e, i) => (
                <div key={i} className={styles.lcRow}>
                    <span className={styles.lcDot} style={{ backgroundColor: e.color }} />
                    <div className={styles.lcInfo}>
                        <div className={styles.lcHead}>
                            <span>{e.name}</span>
                            <span className={styles.lcStat}>{e.area.toFixed(1)} ha ({e.value.toFixed(0)}%)</span>
                        </div>
                        <ProgressBar value={e.value / 100} color={e.color} height={5} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SuitabilityCard({ suitabilities }) {
    const sorted = [...suitabilities].sort((a, b) => parseFloat(b.suitabilityScore || 0) - parseFloat(a.suitabilityScore || 0));

    function levelColor(level) {
        const l = (level || '').toLowerCase();
        if (l.includes('sangat')) return '#2E7D32';
        if (l.includes('cocok') || l.includes('sesuai')) return '#66BB6A';
        if (l.includes('kurang')) return '#FF8F00';
        return '#C62828';
    }
    function levelEmoji(level) {
        const l = (level || '').toLowerCase();
        if (l.includes('sangat')) return '🌟';
        if (l.includes('cocok') || l.includes('sesuai')) return '✅';
        if (l.includes('kurang')) return '⚠️';
        return '❌';
    }

    return (
        <div className={styles.card}>
            {sorted.map((s, i) => {
                const score = parseFloat(s.suitabilityScore || 0);
                const level = s.suitabilityLevel || '-';
                const name = s.commodity?.name || s.commodityName || 'Unknown';
                const color = levelColor(level);
                return (
                    <div key={i} className={styles.suitRow}>
                        <div className={styles.suitHead}>
                            <span style={{ fontSize: 16 }}>{levelEmoji(level)}</span>
                            <span className={styles.suitName}>{name}</span>
                            <span className={styles.suitBadge} style={{ backgroundColor: `${color}1A`, color, borderColor: `${color}4D` }}>{level}</span>
                        </div>
                        <div className={styles.suitBar}>
                            <ProgressBar value={score} color={color} />
                            <span className={styles.suitScore} style={{ color }}>{score.toFixed(2)}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================
// Tab 2: Komoditas
// ============================================================
function CommodityTab({ id }) {
    const { data, loading, error } = useAdvancedData(`/api/advanced/commodity/${id}`);
    if (loading) return <TabLoading />;
    if (error) return <TabError message={error} />;

    const production = data?.production || [];
    const derivedProducts = data?.derivedProducts || [];

    if (production.length === 0 && derivedProducts.length === 0) return <TabEmpty emoji="🌿" message="Data komoditas belum tersedia" />;

    return (
        <div>
            <SectionHeader icon={Leaf} label="Catatan Produksi" />
            {production.length === 0 ? (
                <div className={styles.emptyCard}><Leaf size={32} color="var(--card-border)" /><p>Belum ada data produksi</p></div>
            ) : (
                production.map((p, i) => {
                    const name = p.commodity?.name || p.commodityName || '-';
                    const iconData = getCommodityIconOptions(name);
                    const qty = parseFloat(p.quantityRaw || p.quantity || 0).toFixed(1);
                    return (
                        <div key={i} className={styles.listTile}>
                            <div className={styles.tileIcon} style={{ backgroundColor: `${iconData.color}14` }}>
                                {iconData.assetName ? (
                                    <Image src={getCommodityAssetPath(iconData.assetName)} alt={name} width={30} height={30} style={{ objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: 22 }}>{iconData.emoji}</span>
                                )}
                            </div>
                            <div className={styles.tileContent}>
                                <div className={styles.tileTitle}>{name}</div>
                                <div className={styles.tileSub}>Tahun {p.year || '-'}</div>
                            </div>
                            <div className={styles.tileTrailing}>
                                <div className={styles.tileValue}>{qty}</div>
                                <div className={styles.tileUnit}>Ton</div>
                            </div>
                        </div>
                    );
                })
            )}

            <div style={{ height: 20 }} />
            <SectionHeader icon={Store} label="Produk Turunan" />
            {derivedProducts.length === 0 ? (
                <div className={styles.emptyCard}><Store size={32} color="var(--card-border)" /><p>Belum ada data produk turunan</p></div>
            ) : (
                derivedProducts.map((p, i) => {
                    const commName = p.commodity?.name || p.commodityName || '-';
                    const iconData = getCommodityIconOptions(commName);
                    return (
                        <div key={i} className={styles.listTile}>
                            <div className={styles.tileIcon} style={{ backgroundColor: `${iconData.color}14` }}>
                                {iconData.assetName ? (
                                    <Image src={getCommodityAssetPath(iconData.assetName)} alt={commName} width={30} height={30} style={{ objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: 22 }}>{iconData.emoji}</span>
                                )}
                            </div>
                            <div className={styles.tileContent}>
                                <div className={styles.tileTitle}>{p.name || p.productName || '-'}</div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                                    <span className={styles.catBadge} style={{ backgroundColor: `${iconData.color}1A`, color: iconData.color }}>{p.category || '-'}</span>
                                    <span className={styles.tileSub}>{commName}</span>
                                </div>
                            </div>
                            <div className={styles.tilePrice}>{formatCurrency(p.price || 0)}</div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

// ============================================================
// Tab 3: Sosial
// ============================================================
function SocialTab({ id }) {
    const { data, loading, error } = useAdvancedData(`/api/advanced/social/${id}`);
    if (loading) return <TabLoading />;
    if (error) return <TabError message={error} />;
    if (!data || (!data.institution && !data.demographics && !data.readiness)) return <TabEmpty emoji="👥" message="Data sosial belum tersedia" />;

    const inst = data.institution;
    const demo = data.demographics;
    const ready = data.readiness;

    return (
        <div>
            <SectionHeader icon={Users} label="Profil Kelembagaan" />
            <div className={styles.card}>
                <InfoRow icon={Users} label="Lembaga" value={inst?.fullName || inst?.shortName || '-'} />
                <InfoRow icon={GraduationCap} label="Rata-rata Usia" value={demo ? `${parseFloat(demo.averageAge || 0).toFixed(0)} Tahun` : '-'} />
                <InfoRow icon={Users} label="Dominasi Pendidikan" value={demo?.dominantEducation || '-'} />
            </div>

            <div style={{ height: 20 }} />
            <SectionHeader icon={TrendingUp} label="Kesiapan Usaha" />
            {ready ? <ReadinessCard level={ready.readinessLevel || '-'} score={parseFloat(ready.readinessScore || 0)} /> : (
                <div className={styles.emptyCard}><TrendingUp size={32} color="var(--card-border)" /><p>Data kesiapan belum tersedia</p></div>
            )}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className={styles.infoRow}>
            <Icon size={18} color="var(--forest-mid)" />
            <div className={styles.infoRowContent}>
                <div className={styles.infoRowLabel}>{label}</div>
                <div className={styles.infoRowValue}>{value}</div>
            </div>
        </div>
    );
}

function ReadinessCard({ level, score }) {
    const color = readinessColor(level);
    const emoji = readinessEmoji(level);
    return (
        <div className={styles.heroCard} style={{ borderColor: `${color}4D` }}>
            <div className={styles.heroTop}>
                <div className={styles.heroEmoji} style={{ backgroundColor: `${color}1A` }}>{emoji}</div>
                <div className={styles.heroMid}>
                    <div className={styles.heroLabel}>Tingkat Kesiapan</div>
                    <div className={styles.heroValue} style={{ color }}>{level}</div>
                </div>
                <div className={styles.heroBadge} style={{ backgroundColor: `${color}1A`, color }}>{score.toFixed(2)}</div>
            </div>
            <ProgressBar value={score} color={color} height={10} />
        </div>
    );
}

function readinessColor(level) {
    const l = (level || '').toLowerCase();
    if (l.includes('tinggi') || l.includes('siap')) return '#2E7D32';
    if (l.includes('sedang')) return '#FF8F00';
    return '#C62828';
}
function readinessEmoji(level) {
    const l = (level || '').toLowerCase();
    if (l.includes('tinggi') || l.includes('siap')) return '🚀';
    if (l.includes('sedang')) return '📈';
    return '⚠️';
}

// ============================================================
// Tab 4: Pasar
// ============================================================
function MarketTab({ id, kups }) {
    const { data, loading, error } = useAdvancedData(`/api/advanced/market/${id}`);
    if (loading) return <TabLoading />;
    if (error) return <TabError message={error} />;

    const marketData = data?.marketData || [];
    const hasMarketData = marketData.length > 0;
    const hasKups = kups && kups.length > 0;

    if (!hasMarketData && !hasKups) {
        return <TabEmpty emoji="🏪" message="Belum ada data pasar maupun KUPS" />;
    }

    const prices = marketData.map(d => parseFloat(d.price || 0));
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    // Group by commodity
    const grouped = {};
    marketData.forEach(item => {
        const key = item.commodity?.name || item.commodityName || 'Lainnya';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    });

    return (
        <div>
            {/* KUPS Section */}
            {hasKups && (
                <>
                    <SectionHeader icon={Users} label="Profil KUPS (Kelompok Usaha Perhutanan Sosial)" />
                    <div className={styles.card} style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
                        <div className={styles.kupsTableWrapper}>
                            <table className={styles.kupsTable}>
                                <thead>
                                    <tr>
                                        <th>Nama KUPS</th>
                                        <th>Ketua</th>
                                        <th>Anggota</th>
                                        <th>Komoditas</th>
                                        <th>Kelas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kups.map((k, idx) => (
                                        <tr key={idx}>
                                            <td className={styles.kupsName}>{k.name}</td>
                                            <td>{k.chairmanName || '-'}</td>
                                            <td>{k.totalMembers ? `${k.totalMembers} Orang` : '-'}</td>
                                            <td>{k.commodities || '-'}</td>
                                            <td>
                                                <span className={`${styles.kupsBadge} ${k.businessClass ? styles['badge' + k.businessClass.replace(/\s+/g, '')] : ''}`}>
                                                    {k.businessClass || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Market Data Section */}
            {hasMarketData && (
                <>
                    <SectionHeader icon={BarChart3} label="Ringkasan Pasar" />
                    <div className={styles.miniStatRow}>
                        <MiniStat label="Total Pembeli" value={String(marketData.length)} color="#0288D1" />
                        <MiniStat label="Harga Tertinggi" value={formatCurrency(maxPrice)} color="#2E7D32" />
                        <MiniStat label="Rata-rata" value={formatCurrency(avgPrice)} color="#795548" />
                    </div>

                    <div style={{ height: 20 }} />
                    <SectionHeader icon={Store} label="Data Pembeli per Komoditas" />
                    {Object.entries(grouped).map(([commName, items]) => {
                        const iconData = getCommodityIconOptions(commName);
                        return (
                            <div key={commName} className={styles.card} style={{ marginBottom: 14 }}>
                                <div className={styles.groupHeader}>
                                    <span style={{ fontSize: 20 }}>{iconData.emoji}</span>
                                    <span className={styles.groupName} style={{ color: iconData.color }}>{commName}</span>
                                    <span className={styles.groupCount}>{items.length} pembeli</span>
                                </div>
                                <div className={styles.divider} />
                                {items.map((item, j) => {
                                    const buyerName = item.buyer?.name || item.buyerName || '-';
                                    const buyerType = item.buyer?.type || item.buyerType || '-';
                                    const tColor = buyerTypeColor(buyerType);
                                    return (
                                        <div key={j} className={styles.buyerRow}>
                                            <div className={styles.buyerIcon} style={{ backgroundColor: `${tColor}1A` }}>
                                                <Store size={16} color={tColor} />
                                            </div>
                                            <div className={styles.buyerInfo}>
                                                <div className={styles.buyerName}>{buyerName}</div>
                                                <span className={styles.catBadge} style={{ backgroundColor: `${tColor}1A`, color: tColor }}>{buyerType}</span>
                                            </div>
                                            <div className={styles.tilePrice}>{formatCurrency(item.price || 0)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}

function MiniStat({ label, value, color }) {
    return (
        <div className={styles.miniStat} style={{ backgroundColor: `${color}14`, borderColor: `${color}33` }}>
            <div className={styles.miniStatLabel} style={{ color }}>{label}</div>
            <div className={styles.miniStatValue} style={{ color }}>{value}</div>
        </div>
    );
}

function buyerTypeColor(type) {
    switch ((type || '').toLowerCase()) {
        case 'perusahaan': return '#0288D1';
        case 'koperasi': return '#2E7D32';
        case 'pedagang': return '#F9A825';
        default: return '#795548';
    }
}

// ============================================================
// Tab 5: Risiko
// ============================================================
function RiskTab({ id }) {
    const { data, loading, error } = useAdvancedData(`/api/advanced/risk/${id}`);
    if (loading) return <TabLoading />;
    if (error) return <TabError message={error} />;

    const capacity = data?.capacity;
    const risks = data?.risks || [];

    if (!capacity && risks.length === 0) return <TabEmpty emoji="⚠️" message="Data risiko belum tersedia" />;

    const capLevel = capacity?.capacityLevel || '-';
    const capScore = parseFloat(capacity?.capacityScore || 0);
    const capColor = capacityColor(capLevel);
    const capEmoji = capacityEmoji(capLevel);

    return (
        <div>
            {capacity && (
                <>
                    <SectionHeader icon={Shield} label="Daya Dukung Lingkungan" />
                    <div className={styles.heroCard} style={{ borderColor: `${capColor}59` }}>
                        <div className={styles.heroTop}>
                            <div className={styles.heroEmoji} style={{ backgroundColor: `${capColor}1A` }}>{capEmoji}</div>
                            <div className={styles.heroMid}>
                                <div className={styles.heroLabel}>Kategori</div>
                                <div className={styles.heroValue} style={{ color: capColor }}>{capLevel}</div>
                            </div>
                            <div className={styles.heroBadge} style={{ backgroundColor: `${capColor}1A`, color: capColor }}>Indeks {capScore.toFixed(2)}</div>
                        </div>
                        <ProgressBar value={capScore} color={capColor} height={8} />
                    </div>
                </>
            )}

            <div style={{ height: 20 }} />
            <SectionHeader icon={AlertTriangle} label="Risiko Lingkungan" />
            {risks.length === 0 ? (
                <div className={styles.emptyCard} style={{ backgroundColor: 'var(--forest-fog)' }}>
                    <span style={{ fontSize: 32 }}>✅</span>
                    <p>Tidak ada risiko terdeteksi</p>
                </div>
            ) : (
                risks.map((r, i) => {
                    const severity = r.severity || '-';
                    const color = severityColor(severity);
                    return (
                        <div key={i} className={styles.listTile} style={{ borderColor: `${color}4D` }}>
                            <div className={styles.tileIcon} style={{ backgroundColor: `${color}1A` }}>
                                <AlertTriangle size={18} color={color} />
                            </div>
                            <div className={styles.tileContent}>
                                <div className={styles.tileTitle}>{r.riskType || 'Unknown'}</div>
                                <div className={styles.tileSub}>{r.description || ''}</div>
                            </div>
                            <span className={styles.severityBadge} style={{ backgroundColor: `${color}1A`, color }}>{severity}</span>
                        </div>
                    );
                })
            )}
        </div>
    );
}

function capacityColor(level) {
    const l = (level || '').toLowerCase();
    if (l.includes('tinggi') || l.includes('baik')) return '#2E7D32';
    if (l.includes('sedang')) return '#FF8F00';
    return '#C62828';
}
function capacityEmoji(level) {
    const l = (level || '').toLowerCase();
    if (l.includes('tinggi') || l.includes('baik')) return '🌿';
    if (l.includes('sedang')) return '⚠️';
    return '🔴';
}
function severityColor(sev) {
    switch ((sev || '').toLowerCase()) {
        case 'tinggi': return '#C62828';
        case 'sedang': return '#FF8F00';
        default: return '#795548';
    }
}

// ============================================================
// Tab 6: Prioritas
// ============================================================
function PriorityTab({ id }) {
    const { data, loading, error } = useAdvancedData(`/api/advanced/priority/detail/${id}`);
    if (loading) return <TabLoading />;
    if (error) return <TabError message={error} />;
    if (!data || data.error) return <TabEmpty emoji="📊" message="Data prioritas belum tersedia" />;

    const category = data.priorityCategory || 'BELUM DINILAI';
    const composite = parseFloat(data.compositeScore || 0);
    const catColor = priorityCategoryColor(category);
    const catEmoji = priorityCategoryEmoji(category);

    const components = [
        { label: 'Legalitas', score: parseFloat(data.legalScore || 0), icon: Shield },
        { label: 'Biofisik', score: parseFloat(data.biophysicalScore || 0), icon: Mountain },
        { label: 'Komoditas', score: parseFloat(data.commodityScore || 0), icon: Leaf },
        { label: 'Sosial / SDM', score: parseFloat(data.sdmScore || 0), icon: Users },
        { label: 'Pasar', score: parseFloat(data.marketScore || 0), icon: Store },
        { label: 'Lingkungan', score: parseFloat(data.environmentScore || 0), icon: Shield },
    ];

    return (
        <div>
            {/* Hero */}
            <div className={styles.priorityHero} style={{ background: `linear-gradient(135deg, ${catColor}26, ${catColor}0D)`, borderColor: `${catColor}66` }}>
                <span style={{ fontSize: 40 }}>{catEmoji}</span>
                <div className={styles.priorityLabel} style={{ color: `${catColor}CC` }}>Kategori Prioritas</div>
                <div className={styles.priorityCategory} style={{ color: catColor }}>{category}</div>
                <div className={styles.priorityScorePill} style={{ backgroundColor: `${catColor}26` }}>
                    <span style={{ color: catColor }}>Skor Komposit: </span>
                    <strong style={{ color: catColor, fontSize: 18 }}>{composite.toFixed(3)}</strong>
                </div>
            </div>

            <div style={{ height: 20 }} />
            <SectionHeader icon={Settings} label="Rincian Komponen Skor" />
            <div className={styles.card}>
                {components.map((comp, i) => {
                    const color = comp.score >= 0.75 ? '#2E7D32' : comp.score >= 0.4 ? '#FF8F00' : '#C62828';
                    return (
                        <div key={i} className={styles.compRow}>
                            <comp.icon size={18} color={color} />
                            <span className={styles.compLabel}>{comp.label}</span>
                            <div className={styles.compBar}>
                                <ProgressBar value={comp.score} color={color} />
                            </div>
                            <span className={styles.compScore} style={{ color }}>{comp.score.toFixed(2)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function priorityCategoryColor(cat) {
    if (cat === 'SIAP INDUSTRI') return '#2E7D32';
    if (cat === 'SIAP DIBINA') return '#FF8F00';
    return '#C62828';
}
function priorityCategoryEmoji(cat) {
    if (cat === 'SIAP INDUSTRI') return '🏭';
    if (cat === 'SIAP DIBINA') return '📈';
    return '🔄';
}
