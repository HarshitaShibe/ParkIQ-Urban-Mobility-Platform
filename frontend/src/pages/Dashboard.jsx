import { useEffect, useState } from 'react';
import { AlertTriangle, Activity, MapPin, Radio, ShieldAlert } from 'lucide-react';
import { api } from '../api';
import MapView from '../components/MapView';
import StatCard from '../components/StatCard';
import TrendChart from '../components/TrendChart';
import SeverityBadge from '../components/SeverityBadge';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [overviewData, dailyData, hotspotData] = await Promise.all([
          api.overview(),
          api.trendsDaily(),
          api.hotspots(5)
        ]);
        if (!mounted) return;
        setOverview(overviewData || {});
        setDaily(Array.isArray(dailyData) ? dailyData : []);
        setHotspots(Array.isArray(hotspotData) ? hotspotData : []);
      } catch {
        if (mounted) setError('Dashboard data could not be loaded.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Urban Parking Command Center</h1>
          <p className="page-subtitle">Bengaluru violation heat, anomaly pressure, and citizen reports.</p>
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      <section className="grid stats-grid">
        <StatCard title="Total Violations" value={overview?.total_violations} icon={Activity} color="#06B6D4" subtitle="Historical records" />
        <StatCard title="Critical Zones" value={overview?.critical_zones} icon={ShieldAlert} color="#EF4444" subtitle="Immediate attention" />
        <StatCard title="High Zones" value={overview?.high_zones} icon={AlertTriangle} color="#F59E0B" subtitle="Elevated pressure" />
        <StatCard title="Anomalies" value={overview?.total_anomalies} icon={Radio} color="#3B82F6" subtitle="Detected alerts" />
        <StatCard title="Live Reports Today" value={overview?.live_reports_today} icon={MapPin} color="#10B981" subtitle={overview?.top_hotspot ? `Top: ${overview.top_hotspot}` : 'Citizen uploads'} />
      </section>
      <section className="grid two-col">
        <MapView height={520} />
        <TrendChart data={daily} loading={loading} title="Daily Violation Trend" area />
      </section>
      <section style={{ marginTop: 18 }}>
        <h2 className="section-title">Top 5 Hotspots</h2>
        <div className="hotspot-strip">
          {hotspots.map((item) => (
            <article className="card hotspot-mini" key={item.location}>
              <SeverityBadge severity={item.severity} />
              <h3>{item.location}</h3>
              <div className="score">{item.total_violations} violations | score {item.hotspot_score}</div>
            </article>
          ))}
          {!hotspots.length && !loading && <div className="card empty" style={{ minWidth: 260 }}>No hotspots available.</div>}
        </div>
      </section>
    </div>
  );
}
