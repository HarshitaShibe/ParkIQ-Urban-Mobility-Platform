export default function StatCard({ title, value, icon: Icon, color = 'var(--accent-blue)', subtitle }) {
  return (
    <article className="card stat-card" style={{ borderTopColor: color }}>
      <h3>{title}</h3>
      <div className="value" style={{ color }}>{value ?? '--'}</div>
      {subtitle && <div className="subtitle">{subtitle}</div>}
      {Icon && (
        <div className="stat-icon" style={{ backgroundColor: `${color}22`, color }}>
          <Icon size={32} />
        </div>
      )}
    </article>
  );
}
