'use client';

import { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, GeoJSON, LayersControl, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '@/lib/api';
import ErrorState from '@/components/ui/ErrorState';
import styles from './MapContainer.module.css';

const createBioIcon = () => {
    return L.divIcon({
        html: `<div style="width: 24px; height: 24px; background-color: #2E7D32; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

export default function BiophysicalMapContainer() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMap = async () => {
            try {
                setError(null);
                const res = await api.getBiophysicalMap();
                setData(res);
            } catch (err) {
                setError(err.message);
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

    const defaultCenter = [-0.5, 127.5];
    const defaultZoom = 7;

    return (
        <div className={styles.mapWrapper}>
            <LeafletMap center={defaultCenter} zoom={defaultZoom} className={styles.map} zoomControl={false}>
                <LayersControl position="bottomright">
                    <LayersControl.BaseLayer checked name="Mapbox Streets">
                        <TileLayer url={tileUrl} maxZoom={18} />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                    </LayersControl.BaseLayer>

                    {data && (
                        <LayersControl.Overlay checked name="Titik Biofisik">
                            <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
                                <GeoJSON
                                    data={data}
                                    pointToLayer={(feature, latlng) => {
                                        return L.marker(latlng, { icon: createBioIcon() });
                                    }}
                                    onEachFeature={(feature, layer) => {
                                        if (feature.properties) {
                                            layer.bindPopup(renderBioPopup(feature.properties));
                                        }
                                    }}
                                />
                            </MarkerClusterGroup>
                        </LayersControl.Overlay>
                    )}
                </LayersControl>
            </LeafletMap>

            <div className={styles.headerOverlay}>
                <h1 className={styles.headerTitle}>Peta Kesesuaian Lahan</h1>
            </div>
        </div>
    );
}

function renderBioPopup(props) {
    const scheme = props.scheme || '-';
    const name = props.name || 'Tanpa Nama';
    const biophysical_data = props.biophysical_data ? 'Tersedia' : 'Tidak Ada';
    const id = props.id;

    return `
    <div style="min-width: 200px; font-family: sans-serif; padding: 4px;">
      <div style="background: var(--forest-mid); color: white; padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 11px; font-weight: bold; margin-bottom: 8px;">
        ${scheme}
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #333;">${name}</h3>
      <div style="font-size: 14px; color: #666; margin-bottom: 12px;">Data Biofisik: <strong>${biophysical_data}</strong></div>
      <a href="/permit/${id}" style="display: block; text-align: center; background: var(--forest-mid); color: white; text-decoration: none; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: bold;">
        LIHAT DETAIL
      </a>
    </div>
  `;
}
