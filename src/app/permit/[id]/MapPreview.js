'use client';

import { MapContainer as LeafletMap, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapPreview({ location }) {
    // Try to extract lat/lng and polygon from backend response
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
            polyPositions = points.map(p => [p[1], p[0]]); // Leaflet uses [lat, lng]
        }
    }

    return (
        <LeafletMap
            center={[lat, lng]}
            zoom={polyPositions ? 13 : 8}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            style={{ width: '100%', height: '100%' }}
        >
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
            />
            {polyPositions && (
                <Polygon
                    positions={polyPositions}
                    pathOptions={{
                        color: '#2E7D32',
                        fillColor: '#2E7D32',
                        fillOpacity: 0.3,
                        weight: 2
                    }}
                />
            )}
        </LeafletMap>
    );
}
