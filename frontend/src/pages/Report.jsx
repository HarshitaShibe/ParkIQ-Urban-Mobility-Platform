import { useEffect, useState } from 'react';
import { api } from '../api';
import VideoUpload from '../components/VideoUpload';

export default function Report() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await api.liveReports(10);
        if (mounted) setReports(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setError('Live report feed could not be loaded.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Citizen Report</h1>
          <p className="page-subtitle">Upload a parking violation video with verified location.</p>
        </div>
      </header>
      <VideoUpload />
      <section style={{ marginTop: 22 }}>
        <h2 className="section-title">Recent Live Reports</h2>
        {error && <div className="error">{error}</div>}
        <div className="live-feed">
          {loading ? <div className="skeleton" /> : reports.map((report) => (
            <article className="card feed-row" key={report.id}>
              <div>
                <strong>{report.vehicle_type || 'Vehicle'}</strong>
                <p className="page-subtitle plate">{report.license_plate || 'Plate pending'} | {Number(report.confidence || 0).toFixed(2)} confidence</p>
                <p className="coord">{Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}</p>
              </div>
              <span className="status-badge" style={{ color: report.status === 'resolved' ? '#10B981' : '#06B6D4' }}>{report.status || 'new'}</span>
            </article>
          ))}
          {!loading && !reports.length && <div className="card empty">No live reports yet.</div>}
        </div>
      </section>
    </div>
  );
}
