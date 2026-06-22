import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';
import { SEV_COLORS } from '../constants';
import SeverityBadge from './SeverityBadge';

function HeatLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    let layer;
    let cancelled = false;

    const ensureHeat = () => new Promise((resolve) => {
      if (L.heatLayer) return resolve();
      const existing = document.querySelector('script[data-leaflet-heat]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      script.dataset.leafletHeat = 'true';
      script.onload = resolve;
      document.body.appendChild(script);
    });

    ensureHeat().then(() => {
      if (cancelled || !L.heatLayer || !points?.length) return;
      const heatPoints = points
        .filter((p) => p.latitude && p.longitude)
        .map((p) => [Number(p.latitude), Number(p.longitude), Number(p.weight || 1)]);
      if (!heatPoints.length) return;
      layer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        gradient: { 0.4: '#3B82F6', 0.65: '#F59E0B', 1: '#EF4444' }
      }).addTo(map);
    });

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

const hotspotCoords = {
  'MG Road': [12.9757, 77.6057],
  'Koramangala': [12.9352, 77.6245],
  'Indiranagar': [12.9784, 77.6408],
  'Whitefield': [12.9698, 77.7500],
  'Electronic City': [12.8399, 77.6770],
  'Jayanagar': [12.9250, 77.5938],
  'Hebbal': [13.0358, 77.5970],
  'Majestic': [12.9767, 77.5713],
  'Marathahalli': [12.9569, 77.7011],
  'BTM Layout': [12.9166, 77.6101]
};

function coordsFor(item, index) {
  const found = Object.keys(hotspotCoords).find((name) => item.location?.toLowerCase().includes(name.toLowerCase()));
  if (found) return hotspotCoords[found];
  const angle = index * 0.72;
  return [12.9716 + Math.sin(angle) * 0.05, 77.5946 + Math.cos(angle) * 0.06];
}

export default function MapView({ height = 480, showDeployments = false, deployments = [] }) {
  const [heat, setHeat] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [live, setLive] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [heatData, hotspotData, liveGeo] = await Promise.all([
          api.heatmapPoints(),
          api.hotspots(10),
          api.liveGeoJSON()
        ]);
        if (!mounted) return;
        setHeat(Array.isArray(heatData) ? heatData : []);
        setHotspots(Array.isArray(hotspotData) ? hotspotData : []);
        setLive(Array.isArray(liveGeo?.features) ? liveGeo.features : []);
      } catch (err) {
        if (mounted) setError('Map data could not be loaded.');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const deploymentPins = useMemo(() => deployments.map((d, i) => ({ ...d, coords: coordsFor(d, i) })), [deployments]);

  return (
    <div className="card map-card" style={{ height }}>
      {error && <div className="error">{error}</div>}
      <MapContainer center={[12.9716, 77.5946]} zoom={11} scrollWheelZoom style={{ minHeight: height }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
        <HeatLayer points={heat} />
        {!showDeployments && hotspots.map((item, index) => {
          const severity = String(item.severity || 'MEDIUM').toUpperCase();
          const color = SEV_COLORS[severity] || SEV_COLORS.MEDIUM;
          return (
            <CircleMarker key={`${item.location}-${index}`} center={coordsFor(item, index)} radius={8} pathOptions={{ color: '#fff', weight: 1, fillColor: color, fillOpacity: 0.85 }}>
              <Popup>
                <strong>{item.location}</strong><br />
                Score: <span className="mono">{item.hotspot_score}</span><br />
                <SeverityBadge severity={severity} />
              </Popup>
            </CircleMarker>
          );
        })}
        {showDeployments && deploymentPins.map((item, index) => (
          <CircleMarker key={`${item.location}-${index}`} center={item.coords} radius={13} pathOptions={{ color: '#fff', weight: 2, fillColor: '#EF4444', fillOpacity: 0.9 }}>
            <Popup>
              <strong>#{item.rank_num || index + 1} {item.location}</strong><br />
              Officers: <span className="mono">{item.recommended_officers}</span><br />
              Priority: <span className="mono">{item.priority}</span>
            </Popup>
          </CircleMarker>
        ))}
        {live.map((feature, index) => {
          const coords = feature.geometry?.coordinates || [];
          if (coords.length < 2) return null;
          return (
            <CircleMarker key={feature.id || index} center={[coords[1], coords[0]]} radius={6} pathOptions={{ color: '#06B6D4', fillColor: '#06B6D4', fillOpacity: 0.9, className: 'pulse' }}>
              <Popup>
                <strong>Live report</strong><br />
                {feature.properties?.license_plate || 'Plate pending'}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
