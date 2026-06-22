import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { api } from '../api';
import MapView from '../components/MapView';
import SeverityBadge from '../components/SeverityBadge';

const priorityColor = { IMMEDIATE: '#EF4444', HIGH: '#F59E0B', NORMAL: '#FACC15' };

export default function Enforcement() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await api.enforcement(10);
        if (mounted) setDeployments(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setError('Deployment recommendations could not be loaded.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function copyBriefing() {
    const briefing = deployments.map((d) => (
      `#${d.rank_num} ${d.location}: ${d.priority} priority, ${d.recommended_officers} officers, ${d.shift} shift, score ${d.hotspot_score}`
    )).join('\n');
    await navigator.clipboard.writeText(`ParkIQ Enforcement Briefing\n${briefing}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Deploy Officers</h1>
          <p className="page-subtitle">Shift-ready location priorities for traffic enforcement.</p>
        </div>
        <button className="primary-button" onClick={copyBriefing}><Copy size={16} /> {copied ? 'Copied' : 'Copy Briefing'}</button>
      </header>
      {error && <div className="error">{error}</div>}
      <section className="grid two-col">
        <div className="card table-wrap" style={{ maxHeight: 520 }}>
          {loading ? <div className="skeleton" /> : (
            <table>
              <thead><tr><th>Location</th><th>Score</th><th>Severity</th><th>Officers</th><th>Priority</th><th>Shift</th></tr></thead>
              <tbody>
                {deployments.map((row) => {
                  const priority = String(row.priority || 'NORMAL').toUpperCase();
                  const color = priorityColor[priority] || priorityColor.NORMAL;
                  return (
                    <tr key={`${row.rank_num}-${row.location}`}>
                      <td>{row.location}</td>
                      <td className="number">{row.hotspot_score}</td>
                      <td><SeverityBadge severity={row.severity} /></td>
                      <td className="number">{row.recommended_officers}</td>
                      <td><span className="priority-badge" style={{ color }}>{priority}</span></td>
                      <td className="mono">{row.shift}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && !deployments.length && <div className="empty">No deployment recommendations available.</div>}
        </div>
        <MapView height={520} showDeployments deployments={deployments} />
      </section>
    </div>
  );
}
