'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const BiophysicalMapContainer = dynamic(() => import('@/components/map/BiophysicalMapContainer'), {
    ssr: false,
    loading: () => (
        <div style={{ height: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner />
        </div>
    )
});

export default function BiophysicalMapPage() {
    return (
        <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
            <BiophysicalMapContainer />
        </div>
    );
}
