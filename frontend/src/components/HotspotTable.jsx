import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api';
import SeverityBadge from './SeverityBadge';
import TrendChart from './TrendChart';

export default function HotspotTable({ rows = [], loading }) {
  const [selected, setSelected] = useState(null);
  const [trend, setTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    let mounted = true;
    async function loadTrend() {
      setTrendLoading(true);
      try {
        const data = await api.trendsLocation(selected.location);
        if (mounted) setTrend(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setTrend([]);
      } finally {
        if (mounted) setTrendLoading(false);
      }
    }
    loadTrend();
    return () => { mounted = false; };
  }, [selected]);

  if (loading) return <div className="skeleton" />;

  return (
    <>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Location</th>
              <th>Violations</th>
              <th>Hotspot Score</th>
              <th>Severity</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const score = Math.max(0, Math.min(100, Number(row.hotspot_score || 0)));
              return (
                <tr key={`${row.location}-${index}`} onClick={() => setSelected(row)}>
                  <td className="number">#{row.rank_num || index + 1}</td>
                  <td>{row.location}</td>
                  <td className="number">{row.total_violations}</td>
                  <td>
                    <div className="score-track"><div className="score-fill" style={{ width: `${score}%` }} /></div>
                    <span className="mono">{score.toFixed(1)}</span>
                  </td>
                  <td><SeverityBadge severity={row.severity} /></td>
                  <td>{row.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <div className="empty">No hotspots found for this filter.</div>}
      </div>
      <aside className={`side-panel ${selected ? 'open' : ''}`}>
        <button className="close-button" onClick={() => setSelected(null)} aria-label="Close panel"><X /></button>
        <h2>{selected?.location}</h2>
        <p className="page-subtitle">Location-level violation trend</p>
        {selected && <TrendChart data={trend} xKey="date" yKey="violation_count" loading={trendLoading} />}
      </aside>
    </>
  );
}
