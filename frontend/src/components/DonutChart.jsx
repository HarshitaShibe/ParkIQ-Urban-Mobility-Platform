import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { SEV_COLORS } from '../constants';

export default function DonutChart({ data = [], title, loading }) {
  if (loading) return <div className="skeleton" />;
  if (!data.length) return <div className="card chart-card empty">No summary data available.</div>;

  return (
    <div className="card chart-card">
      {title && <h2 className="section-title">{title}</h2>}
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="severity" innerRadius={64} outerRadius={96} paddingAngle={4}>
            {data.map((entry) => (
              <Cell key={entry.severity} fill={SEV_COLORS[String(entry.severity).toUpperCase()] || '#3B82F6'} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #1F2937', borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
