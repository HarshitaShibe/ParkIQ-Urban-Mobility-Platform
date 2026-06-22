import { useEffect, useState } from 'react';
import { api } from '../api';
import BarChart from '../components/BarChart';
import HotspotTable from '../components/HotspotTable';
import TrendChart from '../components/TrendChart';

const tabs = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'];

export default function Hotspots() {
  const [filter, setFilter] = useState('ALL');
  const [hotspots, setHotspots] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const hotspotPromise = filter === 'ALL' ? api.hotspots(20) : api.hotspotsBySev(filter);
        const [hotspotData, weeklyData] = await Promise.all([hotspotPromise, api.trendsWeekly()]);
        if (!mounted) return;
        setHotspots(Array.isArray(hotspotData) ? hotspotData : []);
        setWeekly(Array.isArray(weeklyData) ? weeklyData : []);
      } catch {
        if (mounted) setError('Hotspot intelligence could not be loaded.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [filter]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Hotspot Intelligence</h1>
          <p className="page-subtitle">Ranked enforcement pressure by location and severity.</p>
        </div>
        <div className="tabs">
          {tabs.map((tab) => <button key={tab} className={`tab ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>{tab}</button>)}
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      <section className="grid two-col">
        <BarChart data={hotspots.slice(0, 15)} loading={loading} title="Top 15 Hotspots" />
        <TrendChart data={weekly} xKey="week_start" yKey="total_violations" loading={loading} title="Weekly Trend" />
      </section>
      <section style={{ marginTop: 18 }}>
        <HotspotTable rows={hotspots} loading={loading} />
      </section>
    </div>
  );
}
