'use client';

import { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, GeoJSON, LayersControl, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '@/lib/api';
import ErrorState from '@/components/ui/ErrorState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import styles from './MapContainer.module.css';

// Custom Point Icon
const createCustomIcon = () => {
    return L.divIcon({
        html: '<div style="width: 20px; height: 20px; background-color: #F57C00; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

const centroidIcon = L.divIcon({
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="var(--surface)" stroke="var(--forest-mid)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
});

export default function MapContainer() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMap = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await api.getMapData();
                setData(res);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMap();
    }, []);

    if (error) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ErrorState message={error} onRetry={() => window.location.reload()} />
            </div>
        );
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const tileUrl = mapboxToken
        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const defaultCenter = [-0.5, 127.5]; // Maluku Utara roughly
    const defaultZoom = 7;

    return (
        <div className={styles.mapWrapper}>
            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <LoadingSpinner />
                    <p className={styles.loadingText}>Memuat Data Peta...</p>
                </div>
            )}
            <LeafletMap
                center={defaultCenter}
                zoom={defaultZoom}
                className={styles.map}
                zoomControl={false}
            >
                <LayersControl position="bottomright">
                    <LayersControl.BaseLayer checked name="Mapbox Streets">
                        <TileLayer
                            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                            url={tileUrl}
                            maxZoom={18}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution="Tiles &copy; Esri"
                        />
                    </LayersControl.BaseLayer>

                    {data && (
                        <>
                            <LayersControl.Overlay checked name="Area Polygon">
                                <GeoJSON
                                    data={data}
                                    filter={(feature) => feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'}
                                    style={{
                                        color: '#1B5E20',
                                        weight: 1,
                                        fillColor: '#4CAF50',
                                        fillOpacity: 0.4
                                    }}
                                    onEachFeature={(feature, layer) => {
                                        if (feature.properties) {
                                            layer.bindPopup(renderPopup(feature.properties));
                                        }
                                    }}
                                />
                            </LayersControl.Overlay>

                            <LayersControl.Overlay checked name="Titik Lokasi">
                                <MarkerClusterGroup
                                    chunkedLoading
                                    maxClusterRadius={40}
                                    showCoverageOnHover={false}
                                >
                                    <GeoJSON
                                        data={data}
                                        pointToLayer={(feature, latlng) => {
                                            return L.marker(latlng, { icon: createCustomIcon() });
                                        }}
                                        onEachFeature={(feature, layer) => {
                                            if (feature.properties) {
                                                layer.bindPopup(renderPopup(feature.properties));
                                            }
                                        }}
                                    />
                                    {/* Manually render centroid markers for polygons if needed */}
                                    {data.features.map((feature, idx) => {
                                        if ((feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') && feature.properties?.hasPolygon) {
                                            let coords = feature.geometry.type === 'MultiPolygon'
                                                ? feature.geometry.coordinates[0][0]
                                                : feature.geometry.coordinates[0];

                                            let sumLat = 0, sumLng = 0;
                                            coords.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
                                            let cLat = sumLat / coords.length;
                                            let cLng = sumLng / coords.length;

                                            return (
                                                <Marker key={`centroid-${idx}`} position={[cLat, cLng]} icon={centroidIcon}>
                                                    <Popup>
                                                        <div dangerouslySetInnerHTML={{ __html: renderPopup(feature.properties) }} />
                                                    </Popup>
                                                </Marker>
                                            );
                                        }
                                        return null;
                                    })}
                                </MarkerClusterGroup>
                            </LayersControl.Overlay>
                        </>
                    )}
                </LayersControl>
            </LeafletMap>

            {/* Floating Header */}
            <div className={styles.headerOverlay}>
                <h1 className={styles.headerTitle}>Peta Perhutanan Sosial</h1>
            </div>
        </div>
    );
}

function renderPopup(props) {
    const scheme = props.scheme || '-';
    const name = props.name || 'Tanpa Nama';
    const area = props.area || 0;
    const regency = props.regency || '-';
    const id = props.id;

    return `
    <div style="min-width: 200px; font-family: sans-serif; padding: 4px;">
      <div style="background: var(--forest-mid); color: white; padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 11px; font-weight: bold; margin-bottom: 8px;">
        ${scheme}
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #333;">${name}</h3>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;"><strong>Luas:</strong> ${parseFloat(area).toFixed(1)} Ha</div>
      <div style="font-size: 12px; color: #666; margin-bottom: 12px;"><strong>Lokasi:</strong> ${regency}</div>
      <a href="/permit/${id}" style="display: block; text-align: center; background: var(--forest-mid); color: white; text-decoration: none; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: bold; transition: background 0.2s;">
        LIHAT DETAIL
      </a>
    </div>
  `;
}
