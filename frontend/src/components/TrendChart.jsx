import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function TrendChart({ data = [], xKey = 'date', yKey = 'total_violations', title, loading, area = false }) {
  if (loading) return <div className="skeleton" />;
  if (!data.length) return <div className="card chart-card empty">No trend data available.</div>;

  const Chart = area ? AreaChart : LineChart;
  return (
    <div className="card chart-card">
      {title && <h2 className="section-title">{title}</h2>}
      <ResponsiveContainer width="100%" height={260}>
        <Chart data={data}>
          <CartesianGrid stroke="#1F2937" vertical={false} />
          <XAxis dataKey={xKey} stroke="#9CA3AF" tick={{ fontSize: 11 }} />
          <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #1F2937', borderRadius: 8 }} labelStyle={{ color: '#F9FAFB' }} />
          {area ? (
            <Area type="monotone" dataKey={yKey} stroke="#06B6D4" fill="#06B6D433" strokeWidth={2} />
          ) : (
            <Line type="monotone" dataKey={yKey} stroke="#06B6D4" strokeWidth={2.5} dot={false} />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
