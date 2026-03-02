'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search as SearchIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import PermitCard from '@/components/ui/PermitCard';
import FilterChip from '@/components/ui/FilterChip';
import ErrorState from '@/components/ui/ErrorState';
import PermitSummaryModal from '@/components/ui/PermitSummaryModal';
import styles from './page.module.css';

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
    const initialPage = parseInt(searchParams.get('page')) || 1;

    const [query, setQuery] = useState(initialQuery);
    const [status, setStatus] = useState(initialStatus);
    const [page, setPage] = useState(initialPage);

    const debouncedQuery = useDebounce(query, 500);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPermit, setSelectedPermit] = useState(null);
    const scrollRef = useRef(null);

    // Update URL function
    const updateUrl = useCallback((newQuery, newStatus, newPage) => {
        const params = new URLSearchParams();
        if (newQuery) params.set('q', newQuery);
        if (newStatus) params.set('status', newStatus);
        if (newPage > 1) params.set('page', newPage.toString());
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.searchPermits({
                q: debouncedQuery,
                status,
                page,
                limit: 25
            });
            setData(res);
            updateUrl(debouncedQuery, status, page);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, status, page, updateUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Search Input
    const handleSearchChange = (e) => {
        setQuery(e.target.value);
        setPage(1); // Reset page on new search
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

    const permits = data?.data || [];
    const total = data?.meta?.total || 0;
    const totalPages = Math.ceil(total / 25);

    return (
        <div className={styles.container}>
            {/* Hero Header */}
            <div className={styles.hero} ref={scrollRef}>
                <div className={styles.heroBg} />
                <div className={styles.heroContent}>
                    <h1 className={styles.title}>Jelajahi<br />Perhutanan Sosial</h1>
                    <p className={styles.subtitle}>Temukan data SK dan lokasi</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className={styles.searchWrapper}>
                <div className={styles.searchContainer}>
                    <SearchIcon className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Cari desa, lembaga, atau SK..."
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
                {/* Filters */}
                <div className={styles.filtersWrapper}>
                    <div className={styles.filtersList}>
                        <FilterChip
                            label="Izin"
                            isSelected={status === 'Izin'}
                            onClick={() => handleFilterToggle('Izin')}
                        />
                        <FilterChip
                            label="Proses"
                            isSelected={status === 'Proses'}
                            onClick={() => handleFilterToggle('Proses')}
                        />
                    </div>
                </div>

                {/* Count Info */}
                {!loading && !error && (
                    <div className={styles.countInfo}>
                        Menampilkan {permits.length} dari {total} data
                    </div>
                )}

                {/* Results */}
                {error && <ErrorState message={error} onRetry={fetchData} />}

                {loading && !data && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner} />
                    </div>
                )}

                {!error && data && permits.length === 0 && (
                    <div className={styles.emptyState}>
                        <SearchIcon size={48} className={styles.emptyIcon} />
                        <p>Tidak ada data ditemukan</p>
                    </div>
                )}

                {!error && permits.length > 0 && (
                    <div className={`${styles.resultsGrid} ${loading ? styles.loadingGrid : ''}`}>
                        {permits.map(permit => (
                            <PermitCard key={permit.id} permit={permit} onClick={() => setSelectedPermit(permit)} />
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
