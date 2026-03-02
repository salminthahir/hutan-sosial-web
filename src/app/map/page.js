'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MapContainer = dynamic(() => import('@/components/map/MapContainer'), {
    ssr: false,
    loading: () => (
        <div style={{ height: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner />
        </div>
    )
});

export default function MapPage() {
    return (
        <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
            <MapContainer />
        </div>
    );
}
