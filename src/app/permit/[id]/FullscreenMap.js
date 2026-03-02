'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer as LeafletMap, TileLayer, Polygon, useMap } from 'react-leaflet';
import { X, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

function ZoomControls() {
    const map = useMap();
    return (
        <div style={{
            position: 'absolute', bottom: 80, right: 16, zIndex: 1000,
            display: 'flex', flexDirection: 'column', gap: 8
        }}>
            <button onClick={() => map.zoomIn()} style={btnStyle} aria-label="Zoom in">
                <ZoomIn size={20} />
            </button>
            <button onClick={() => map.zoomOut()} style={btnStyle} aria-label="Zoom out">
                <ZoomOut size={20} />
            </button>
        </div>
    );
}

const btnStyle = {
    width: 44, height: 44, borderRadius: 12,
    background: 'white', border: '1px solid #ddd',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    color: '#333'
};

export default function FullscreenMap({ location, onClose }) {
    const geo = location?.geo?.coordinates || [];
    const lat = geo[1] || 0.5;
    const lng = geo[0] || 127.5;

    const boundary = location?.boundary?.coordinates;
    let polyPositions = null;

    if (boundary && boundary.length > 0) {
        let points = [];
        if (location.boundary.type === 'MultiPolygon') {
            points = boundary[0][0];
        } else if (location.boundary.type === 'Polygon') {
            points = boundary[0];
        }
        if (points.length > 0) {
            polyPositions = points.map(p => [p[1], p[0]]);
        }
    }

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const [tileType, setTileType] = useState('satellite');

    const tiles = tileType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999, background: '#000',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <LeafletMap
                center={[lat, lng]}
                zoom={polyPositions ? 14 : 8}
                zoomControl={false}
                style={{ width: '100%', height: '100%' }}
            >
                <TileLayer url={tiles} attribution="Tiles &copy; Esri / OSM" />
                {polyPositions && (
                    <Polygon
                        positions={polyPositions}
                        pathOptions={{
                            color: '#4CAF50',
                            fillColor: '#4CAF50',
                            fillOpacity: 0.25,
                            weight: 2.5
                        }}
                    />
                )}
                <ZoomControls />
            </LeafletMap>

            {/* Close button */}
            <button onClick={onClose} style={{
                position: 'absolute', top: 16, left: 16, zIndex: 10000,
                ...btnStyle, width: 44, height: 44
            }} aria-label="Tutup peta">
                <X size={22} />
            </button>

            {/* Map type toggle */}
            <button onClick={() => setTileType(t => t === 'satellite' ? 'street' : 'satellite')} style={{
                position: 'absolute', top: 16, right: 16, zIndex: 10000,
                ...btnStyle, width: 'auto', paddingLeft: 12, paddingRight: 14, gap: 6,
                fontSize: 13, fontWeight: 600
            }}>
                <Layers size={16} />
                {tileType === 'satellite' ? 'Peta' : 'Satelit'}
            </button>
        </div>
    );
}
