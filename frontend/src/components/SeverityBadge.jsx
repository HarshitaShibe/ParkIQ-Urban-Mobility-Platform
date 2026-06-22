import { SEV_COLORS } from '../constants';

export default function SeverityBadge({ severity = 'MEDIUM' }) {
  const label = String(severity || 'MEDIUM').toUpperCase();
  const color = SEV_COLORS[label] || SEV_COLORS.MEDIUM;
  return (
    <span className="severity-badge" style={{ color, backgroundColor: `${color}14` }}>
      {label}
    </span>
  );
}
