import { Bar, BarChart as ReBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function BarChart({ data = [], xKey = 'location', yKey = 'total_violations', title, loading }) {
  if (loading) return <div className="skeleton" />;
  if (!data.length) return <div className="card chart-card empty">No bar chart data available.</div>;

  return (
    <div className="card chart-card">
      {title && <h2 className="section-title">{title}</h2>}
      <ResponsiveContainer width="100%" height={300}>
        <ReBarChart data={data}>
          <CartesianGrid stroke="#1F2937" vertical={false} />
          <XAxis dataKey={xKey} stroke="#9CA3AF" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={78} />
          <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #1F2937', borderRadius: 8 }} />
          <Bar dataKey={yKey} fill="#3B82F6" radius={[6, 6, 0, 0]} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
