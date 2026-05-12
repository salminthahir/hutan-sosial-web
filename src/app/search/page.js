'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search as SearchIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import PermitCard from '@/components/ui/PermitCard';
import KupsCard from '@/components/ui/KupsCard';
import FilterChip from '@/components/ui/FilterChip';
import ErrorState from '@/components/ui/ErrorState';
import PermitSummaryModal from '@/components/ui/PermitSummaryModal';
import styles from './page.module.css';
import kupsStyles from '@/components/ui/KupsCard.module.css';

// Debounce helper
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const initialQuery = searchParams.get('q') || '';
    const initialStatus = searchParams.get('status') || '';
    const initialView = searchParams.get('view') || 'permits';
    const initialPage = parseInt(searchParams.get('page')) || 1;

    const [query, setQuery] = useState(initialQuery);
    const [status, setStatus] = useState(initialStatus);
    const [viewMode, setViewMode] = useState(initialView); // 'permits' | 'kups'
    const [page, setPage] = useState(initialPage);

    // KUPS-specific filters
    const [kupsClassFilter, setKupsClassFilter] = useState('');
    const [kupsClusterFilter, setKupsClusterFilter] = useState('');
    const [kupsFilters, setKupsFilters] = useState(null);

    const debouncedQuery = useDebounce(query, 500);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPermit, setSelectedPermit] = useState(null);
    const scrollRef = useRef(null);

    // Update URL function
    const updateUrl = useCallback((newQuery, newStatus, newPage, newView) => {
        const params = new URLSearchParams();
        if (newQuery) params.set('q', newQuery);
        if (newStatus && newView === 'permits') params.set('status', newStatus);
        if (newView !== 'permits') params.set('view', newView);
        if (newPage > 1) params.set('page', newPage.toString());
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router]);

    // Fetch KUPS filter options
    useEffect(() => {
        if (viewMode === 'kups' && !kupsFilters) {
            api.getKupsFilters()
                .then(res => setKupsFilters(res))
                .catch(() => {}); // Silently fail
        }
    }, [viewMode, kupsFilters]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let res;
            if (viewMode === 'kups') {
                res = await api.searchKups({
                    q: debouncedQuery,
                    businessClass: kupsClassFilter,
                    cluster: kupsClusterFilter,
                    page,
                    limit: 24,
                });
            } else {
                res = await api.searchPermits({
                    q: debouncedQuery,
                    status,
                    page,
                    limit: 24,
                });
            }

            setData(res);
            updateUrl(debouncedQuery, status, page, viewMode);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, status, page, viewMode, kupsClassFilter, kupsClusterFilter, updateUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Search Input
    const handleSearchChange = (e) => {
        setQuery(e.target.value);
        setPage(1);
    };

    const clearSearch = () => {
        setQuery('');
        setPage(1);
    };

    // Handle Filter
    const handleFilterToggle = (filterStatus) => {
        setStatus(prev => prev === filterStatus ? '' : filterStatus);
        setPage(1);
    };

    // Handle View Mode Switch
    const handleViewSwitch = (mode) => {
        setViewMode(mode);
        setPage(1);
        setData(null);
        setQuery('');
        setStatus('');
        setKupsClassFilter('');
        setKupsClusterFilter('');
    };

    // Handle KUPS class filter
    const handleClassFilter = (cls) => {
        setKupsClassFilter(prev => prev === cls ? '' : cls);
        setPage(1);
    };

    const scrollToTop = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Handle Pagination
    const handlePageChange = (newPage) => {
        setPage(newPage);
        scrollToTop();
    };

    const items = data?.data || [];
    const total = data?.meta?.total || 0;
    const totalPages = Math.ceil(total / 24);

    const searchPlaceholder = viewMode === 'kups'
        ? 'Cari nama KUPS, komoditas, ketua...'
        : 'Cari desa, lembaga, atau SK...';

    return (
        <div className={styles.container}>
            {/* Hero Header */}
            <div className={styles.hero} ref={scrollRef}>
                <div className={styles.heroBg} />
                <div className={styles.heroContent}>
                    <h1 className={styles.title}>Jelajahi<br />Perhutanan Sosial</h1>
                    <p className={styles.subtitle}>
                        {viewMode === 'kups' 
                            ? 'Temukan data KUPS dan potensinya' 
                            : 'Temukan data SK dan lokasi'}
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className={styles.searchWrapper}>
                <div className={styles.searchContainer}>
                    <SearchIcon className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder={searchPlaceholder}
                        value={query}
                        onChange={handleSearchChange}
                    />
                    {query && (
                        <button className={styles.clearBtn} onClick={clearSearch}>
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            <main className={styles.main}>
                {/* View Mode + Filters */}
                <div className={styles.filtersWrapper}>
                    <div className={styles.filtersList}>
                        {/* Permit filters */}
                        <FilterChip
                            label="Izin"
                            isSelected={viewMode === 'permits' && status === 'Izin'}
                            onClick={() => {
                                if (viewMode !== 'permits') handleViewSwitch('permits');
                                handleFilterToggle('Izin');
                            }}
                        />

                        {/* Divider */}
                        <div style={{
                            width: '1px',
                            height: '32px',
                            background: 'var(--card-border)',
                            margin: '0 4px',
                            alignSelf: 'center',
                        }} />

                        {/* KUPS Tab */}
                        <FilterChip
                            label="KUPS"
                            isSelected={viewMode === 'kups'}
                            onClick={() => {
                                if (viewMode !== 'kups') handleViewSwitch('kups');
                            }}
                        />
                    </div>
                </div>

                {/* KUPS Sub-filters (only when KUPS view active) */}
                {viewMode === 'kups' && (
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px',
                        overflowX: 'auto',
                        paddingBottom: '4px',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                    }}>
                        {['Platinum', 'Gold', 'Blue', 'Silver'].map(cls => (
                            <button
                                key={cls}
                                onClick={() => handleClassFilter(cls)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    border: kupsClassFilter === cls
                                        ? '1.5px solid var(--forest-mid)'
                                        : '1px solid var(--card-border)',
                                    background: kupsClassFilter === cls
                                        ? 'var(--forest-mid)'
                                        : 'var(--surface)',
                                    color: kupsClassFilter === cls
                                        ? '#FFFFFF'
                                        : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {cls}
                                {kupsFilters?.classes?.find(c => c.name === cls) && (
                                    <span style={{ marginLeft: '4px', opacity: 0.6 }}>
                                        ({kupsFilters.classes.find(c => c.name === cls).count})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Count Info */}
                {!loading && !error && (
                    <div className={styles.countInfo}>
                        Menampilkan {items.length} dari {total} data{' '}
                        {viewMode === 'kups' ? 'KUPS' : ''}
                    </div>
                )}

                {/* Results */}
                {error && <ErrorState message={error} onRetry={fetchData} />}

                {loading && !data && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner} />
                    </div>
                )}

                {!error && data && items.length === 0 && (
                    <div className={styles.emptyState}>
                        <SearchIcon size={48} className={styles.emptyIcon} />
                        <p>Tidak ada data ditemukan</p>
                    </div>
                )}

                {/* Permit Results */}
                {!error && viewMode === 'permits' && items.length > 0 && (
                    <div className={`${styles.resultsGrid} ${loading ? styles.loadingGrid : ''}`}>
                        {items.map(permit => (
                            <PermitCard key={permit.id} permit={permit} onClick={() => setSelectedPermit(permit)} />
                        ))}
                    </div>
                )}

                {/* KUPS Results */}
                {!error && viewMode === 'kups' && items.length > 0 && (
                    <div className={`${kupsStyles.kupsGrid} ${loading ? kupsStyles.kupsGridLoading : ''}`}>
                        {items.map(kups => (
                            <KupsCard key={kups.id} kups={kups} />
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {!error && totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            className={styles.pageBtn}
                            disabled={page <= 1}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className={styles.pageText}>
                            Halaman <strong>{page}</strong> dari {totalPages}
                        </span>
                        <button
                            className={styles.pageBtn}
                            disabled={page >= totalPages}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </main>

            {selectedPermit && (
                <PermitSummaryModal
                    permit={selectedPermit}
                    onClose={() => setSelectedPermit(null)}
                />
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
            <SearchContent />
        </Suspense>
    );
}
