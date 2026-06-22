import { SEV_COLORS } from '../constants';
import SeverityBadge from './SeverityBadge';

export default function AlertCard({ alert }) {
  const severity = String(alert?.severity || 'MEDIUM').toUpperCase();
  const color = SEV_COLORS[severity] || SEV_COLORS.MEDIUM;

  return (
    <article className="card alert-card" style={{ borderLeftColor: color, backgroundColor: `${color}0d` }}>
      <div className="alert-head">
        <SeverityBadge severity={severity} />
        <div className="alert-meta">
          <span className="date">{alert?.date}</span>
          <span className="number">{alert?.violation_count ?? 0} cases</span>
        </div>
      </div>
      <h3>{alert?.location || 'Unknown location'}</h3>
      <p>{alert?.alert_message || 'Anomaly detected in parking activity.'}</p>
    </article>
  );
}
