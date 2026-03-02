'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShieldAlert, ShieldCheck, Clock, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import ErrorState from '@/components/ui/ErrorState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import styles from './page.module.css';

export default function LegalDashboard() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLegal = async () => {
            try {
                const res = await api.getLegalDashboard();
                setData(res);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLegal();
    }, []);

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center' }}><LoadingSpinner /></div>;
    if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
    if (!data) return null;

    const summary = data.statusSummary || [];
    const activeCount = parseInt(summary.find(s => s.permitStatus === 'AKTIF')?.count || 0);
    const processCount = summary.reduce((acc, curr) => curr.permitStatus !== 'AKTIF' ? acc + parseInt(curr.count) : acc, 0);

    const expiring = data.alerts?.expiring || [];
    const currentYear = new Date().getFullYear();
    const expiringThisYear = expiring.filter(p => new Date(p.validUntil).getFullYear() === currentYear).length;
    const expiringNextYear = expiring.filter(p => new Date(p.validUntil).getFullYear() === currentYear + 1).length;
    const expired = data.alerts?.expired?.length || 0;

    // Format timeline data
    const timelineData = (data.timeline || []).map(t => ({
        year: t.permitYear?.toString() || 'Unknown',
        count: parseInt(t.count) || 0,
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.back()}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className={styles.title}>Dashboard Legalitas</h1>
            </header>

            <main className={styles.main}>
                {/* Alerts Section */}
                <section className={styles.alertsSection}>
                    {(expiringThisYear > 0 || expiringNextYear > 0) && (
                        <div className={`${styles.alertCard} ${styles.alertWarning}`}>
                            <div className={styles.alertIcon}><Clock size={24} /></div>
                            <div className={styles.alertContent}>
                                <h3 className={styles.alertTitle}>SK Mendekati Kedaluwarsa</h3>
                                <p className={styles.alertDesc}>
                                    Terdapat <strong>{expiringThisYear}</strong> SK yang akan habis masa berlakunya tahun ini, dan <strong>{expiringNextYear}</strong> SK tahun depan.
                                </p>
                            </div>
                        </div>
                    )}

                    {expired > 0 && (
                        <div className={`${styles.alertCard} ${styles.alertDanger}`}>
                            <div className={styles.alertIcon}><ShieldAlert size={24} /></div>
                            <div className={styles.alertContent}>
                                <h3 className={styles.alertTitle}>SK Sudah Kedaluwarsa</h3>
                                <p className={styles.alertDesc}>
                                    Perhatian: Terdapat <strong>{expired}</strong> SK yang sudah habis masa berlakunya.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Summary Cards */}
                <section className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <ShieldCheck size={32} className={styles.summaryIconSuccess} />
                        <div className={styles.summaryValue}>{activeCount}</div>
                        <div className={styles.summaryLabel}>SK Aktif</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <FileText size={32} className={styles.summaryIconWarning} />
                        <div className={styles.summaryValue}>{processCount}</div>
                        <div className={styles.summaryLabel}>Dalam Proses</div>
                    </div>
                </section>

                {/* Timeline Chart */}
                {timelineData.length > 0 && (
                    <section className={styles.chartSection}>
                        <h2 className={styles.sectionTitle}>Timeline Penerbitan SK</h2>
                        <div className={styles.chartCard}>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEEE" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                        <Tooltip cursor={{ fill: '#F5F5F5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="count" name="Total SK" fill="var(--forest-mid)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
