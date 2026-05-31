'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#f59e0b','#f97316','#ef4444','#ec4899','#a855f7','#6366f1','#3b82f6','#14b8a6','#10b981','#84cc16','#eab308','#fb923c','#f87171','#8b5cf6','#06b6d4'];

interface Props { data: { name: string; icon: string; value: number }[]; title: string; }

const tooltipStyle = { background: '#ffffff', border: '1px solid #ede6dd', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontFamily: 'Inter, system-ui, sans-serif' };

export default function CategoryPieChart({ data, title }: Props) {
  if (!data.length) return <div className="card p-3"><p className="caption">暂无数据</p></div>;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card p-3">
      {title && <h3 className="section-title text-xs mb-1">{title}</h3>}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={1} dataKey="value">
            {data.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`¥${Number(v).toLocaleString()} (${((Number(v) / total) * 100).toFixed(1)}%)`, '']} />
          <Legend formatter={(value: string) => <span className="caption text-[10px]">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
