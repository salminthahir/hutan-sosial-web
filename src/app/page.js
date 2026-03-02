'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Mountain, Shield, ChevronRight, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';
import styles from './page.module.css';

const SCHEME_COLORS = ['#2E7D32', '#1565C0', '#E65100', '#6A1B9A', '#00838F'];

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

  if (loading && !data) return <LoadingSpinner />;
  if (error && !data) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!data) return null;

  const totalPermits = data.totalPermits || 0;
  const totalArea = parseFloat(data.totalArea || 0);
  const byScheme = data.byScheme || [];
  const byRegency = data.byRegency || [];

  // Format Recharts data
  const pieData = byScheme.map((s) => ({
    name: s.scheme_name,
    value: parseInt(s.count, 10) || 0,
  }));

  return (
    <div className={styles.container}>
      {/* Header Info */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.titleMobile}>Hutan Sosial</span>
            <span className={styles.titleDesktop}>Dinas Kehutanan</span>
          </h1>
          <p className={styles.subtitle}>Maluku Utara</p>
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

        {/* Chart Section */}
        {byScheme.length > 0 && (
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
                    <div className={styles.legendLabel}>
                      {entry.name} <span className={styles.legendValue}>({entry.value})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

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
      </main>
    </div>
  );
}
