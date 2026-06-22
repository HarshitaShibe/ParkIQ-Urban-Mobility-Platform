import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import AlertCard from '../components/AlertCard';
import DonutChart from '../components/DonutChart';
import TrendChart from '../components/TrendChart';

const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'];

export default function Anomalies() {
  const [severity, setSeverity] = useState('ALL');
  const [days, setDays] = useState('7');
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [alertData, summaryData] = await Promise.all([
          severity === 'ALL' ? api.recentAnomalies(Number(days)) : api.anomalies(severity, 50),
          api.anomalySummary()
        ]);
        if (!mounted) return;
        setAlerts(Array.isArray(alertData) ? alertData : []);
        setSummary(Array.isArray(summaryData) ? summaryData : []);
      } catch {
        if (mounted) setError('Anomaly alerts could not be loaded.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [severity, days]);

  const timeline = useMemo(() => {
    const grouped = alerts.reduce((acc, item) => {
      const key = item.date || 'Unknown';
      acc[key] = (acc[key] || 0) + Number(item.violation_count || 0);
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, total_violations]) => ({ date, total_violations }));
  }, [alerts]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Anomaly Alerts</h1>
          <p className="page-subtitle">Unusual spikes and enforcement exceptions.</p>
        </div>
        <div className="filters">
          <span className="live-label"><span className="dot" style={{ background: '#EF4444' }} /> LIVE</span>
          <select className="tab" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {severities.map((sev) => <option key={sev}>{sev}</option>)}
          </select>
          <select className="tab" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      <section className="grid two-col">
        <DonutChart data={summary} loading={loading} title="Severity Summary" />
        <TrendChart data={timeline} loading={loading} title="Anomaly Timeline" />
      </section>
      <section className="grid" style={{ marginTop: 18 }}>
        {loading ? <div className="skeleton" /> : alerts.map((alert) => <AlertCard key={alert.alert_id || `${alert.location}-${alert.date}`} alert={alert} />)}
        {!loading && !alerts.length && <div className="card empty">No anomaly alerts match this filter.</div>}
      </section>
    </div>
  );
}
