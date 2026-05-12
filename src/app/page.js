'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FileText, Mountain, Shield, ChevronRight, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import DashboardSkeleton from './DashboardSkeleton';
import ErrorState from '@/components/ui/ErrorState';
import styles from './page.module.css';

const SCHEME_COLORS = ['#2E7D32', '#1565C0', '#E65100', '#6A1B9A', '#00838F'];

const SCHEMES_INFO = [
  {
    key: 'HD',
    name: 'Hutan Desa (HD)',
    desc: 'Hutan negara yang dikelola oleh lembaga desa (misal: BUMDes atau koperasi desa) untuk kesejahteraan desa.',
    matchKeywords: ['hutan desa', 'hd']
  },
  {
    key: 'HKm',
    name: 'Hutan Kemasyarakatan (HKm)',
    desc: 'Hutan negara yang pemanfaatannya ditujukan untuk memberdayakan masyarakat setempat.',
    matchKeywords: ['hutan kemasyarakatan', 'hkm']
  },
  {
    key: 'HTR',
    name: 'Hutan Tanaman Rakyat (HTR)',
    desc: 'Hutan produksi yang dibangun oleh kelompok masyarakat untuk meningkatkan potensi dan kualitas hutan dengan sistem silvikultur.',
    matchKeywords: ['hutan tanaman rakyat', 'htr']
  },
  {
    key: 'HA',
    name: 'Hutan Adat (HA)',
    desc: 'Hutan yang berada dalam wilayah masyarakat hukum adat, yang diakui hak pengelolaannya oleh negara.',
    matchKeywords: ['hutan adat', 'ha']
  },
  {
    key: 'KK',
    name: 'Kemitraan Kehutanan (KK)',
    desc: 'Kerja sama antara masyarakat setempat dengan pengelola hutan (perhutani/perusahaan) atau pemegang izin usaha pemanfaatan hutan.',
    matchKeywords: ['kemitraan kehutanan', 'kk']
  }
];

const KUPS_CLASS_INFO = [
  { class: 'Platinum', desc: 'Pasar skala nasional/internasional, mandiri secara permodalan dan manajerial', color: 'var(--kups-platinum)', bg: 'var(--kups-platinum-bg)', border: '#A7F3D0' },
  { class: 'Gold', desc: 'Sudah memiliki akses pasar yang stabil dan pendapatan rutin', color: 'var(--kups-gold)', bg: 'var(--kups-gold-bg)', border: '#FDE68A' },
  { class: 'Blue', desc: 'Sudah memiliki akses permodalan awal dan pasar lokal', color: 'var(--kups-blue)', bg: 'var(--kups-blue-bg)', border: '#C5CAE9' },
  { class: 'Silver', desc: 'Tahap awal pembentukan, menyusun rencana usaha', color: 'var(--kups-silver)', bg: 'var(--kups-silver-bg)', border: '#D1D5DB' }
];

export default function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getStats();
      setData(res.data || res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const navigateToSearch = (status = null, query = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (query) params.append('q', query);
    router.push(`/search?${params.toString()}`);
  };

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!data) return null;

  const totalPermits = data.totalPermits || 0;
  const totalArea = parseFloat(data.totalArea || 0);
  const byScheme = data.byScheme || [];
  const byRegency = data.byRegency || [];
  const totalKups = data.totalKups || 0;
  const kupsByClass = data.kupsByClass || [];

  // Format Recharts data (guarantee all 5 schemes)
  const pieData = SCHEMES_INFO.map(info => {
    const backendData = byScheme.find(s => {
      const dbName = (s.scheme_name || '').toLowerCase();
      // Only match keywords if they are exact words, or just simple includes
      return info.matchKeywords.some(kw => dbName.includes(kw));
    });
    
    return {
      name: info.name,
      value: backendData ? parseInt(backendData.count, 10) || 0 : 0,
      desc: info.desc
    };
  });

  return (
    <div className={styles.container}>
      {/* Header Info */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoTitleWrapper}>
            <Image src="/images/logo/Logo_Malut.svg" alt="Logo Malut" width={32} height={32} className={styles.mobileLogo} />
            <div>
              <h1 className={styles.title}>
                <span className={styles.titleMobile}>Hutan Sosial</span>
                <span className={styles.titleDesktop}>Dinas Kehutanan</span>
              </h1>
              <p className={styles.subtitle}>Maluku Utara</p>
            </div>
          </div>
        </div>
        <button onClick={fetchStats} className={styles.refreshBtn} aria-label="Refresh">
          <RefreshCw size={20} className={loading ? styles.spinning : ''} />
        </button>
      </header>

      <main className={styles.main}>
        {/* Summary Cards */}
        <section className={styles.summarySection}>
          <StatCard
            title="Total SK"
            value={totalPermits.toLocaleString('id-ID')}
            icon={FileText}
            colorClass="forestMid"
            onClick={() => navigateToSearch()}
          />
          <StatCard
            title="Total Luas (Ha)"
            value={totalArea.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
            icon={Mountain}
            colorClass="soilBrown"
            onClick={() => navigateToSearch('Izin')}
          />
        </section>

        <div className={styles.dashboardCardsGrid}>
          {/* Legal Dashboard Entry */}
          <button
            className={styles.legalCard}
            onClick={() => router.push('/dashboard/legal')}
          >
            <div className={styles.legalIconWrapper}>
              <Shield size={24} className={styles.legalIcon} />
            </div>
            <div className={styles.legalContent}>
              <div className={styles.legalTitle}>Dashboard Legalitas</div>
              <div className={styles.legalSubtitle}>Monitoring masa berlaku SK dan kelengkapan dokumen</div>
            </div>
            <ChevronRight size={16} className={styles.legalArrow} />
          </button>

          {/* Admin Panel Entry */}
          <button
            className={`${styles.legalCard} ${styles.adminCardOutline}`}
            onClick={() => router.push('/admin/dashboard')}
          >
            <div className={styles.adminIconWrapper}>
              <Shield size={24} className={styles.adminIcon} />
            </div>
            <div className={styles.legalContent}>
              <div className={styles.legalTitle}>Panel Admin</div>
              <div className={styles.legalSubtitle}>Login untuk mengelola data perhutanan sosial</div>
            </div>
            <ChevronRight size={16} className={styles.legalArrow} />
          </button>
        </div>

        {/* Chart Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Distribusi per Skema</h2>
          <div className={styles.chartCard}>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SCHEME_COLORS[index % SCHEME_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.legendContainer}>
                {pieData.map((entry, index) => (
                  <div key={entry.name} className={styles.legendItem}>
                    <div
                      className={styles.legendColor}
                      style={{ backgroundColor: SCHEME_COLORS[index % SCHEME_COLORS.length] }}
                    />
                    <div className={styles.legendContent}>
                      <div className={styles.legendLabel}>
                        {entry.name} <span className={styles.legendValue}>({entry.value})</span>
                      </div>
                      <div className={styles.legendDesc}>{entry.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        {/* Regency List Section */}
        {byRegency.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Distribusi per Kabupaten/Kota</h2>
            <div className={styles.listCard}>
              {byRegency.map((r, i) => {
                const count = parseInt(r.count, 10) || 0;
                const name = r.regency_name || '-';
                const pct = totalPermits > 0 ? (count / totalPermits) * 100 : 0;

                return (
                  <button
                    key={i}
                    className={styles.listItem}
                    onClick={() => navigateToSearch(null, name)}
                  >
                    <div className={styles.avatar}>{count}</div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemName}>{name}</div>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <ChevronRight size={16} className={styles.itemArrow} />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* KUPS Summary Section */}
        <section className={styles.section} style={{ marginTop: '32px' }}>
          <h2 className={styles.sectionTitle}>Kelompok Usaha Perhutanan Sosial (KUPS)</h2>

          <div className={styles.listCard} style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Total ada <strong style={{ color: 'var(--text-primary)' }}>{totalKups.toLocaleString('id-ID')} KUPS</strong> yang telah terhubung dengan izin.
              </p>
              <button 
                className={styles.refreshBtn} 
                style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '20px', display: 'flex', gap: '4px', alignItems: 'center', background: 'var(--forest-light)', color: 'var(--forest-dark)', border: 'none', fontWeight: 600 }}
                onClick={() => router.push('/search?view=kups')}
              >
                Lihat Semua KUPS <ChevronRight size={16} />
              </button>
            </div>

            <div className={styles.kupsClassesGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {KUPS_CLASS_INFO.map(info => {
                const countMatch = kupsByClass.find(c => c.businessClass === info.class);
                const count = countMatch ? parseInt(countMatch.count, 10) : 0;
                
                return (
                  <div 
                    key={info.class} 
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px',
                      border: '1px solid var(--card-border)',
                      borderLeft: `4px solid ${info.color}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      background: 'var(--surface)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Kelas {info.class}</span>
                      <span style={{ 
                        backgroundColor: info.bg, 
                        color: info.color, 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '13px',
                        border: `1px solid ${info.border}`
                      }}>
                        {count}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      {info.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
