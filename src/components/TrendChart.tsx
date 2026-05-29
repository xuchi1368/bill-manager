'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendData {
  date: string;
  income: number;
  expense: number;
}

export default function TrendChart({ data }: { data: TrendData[] }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">📈 收支趋势（近30天）</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
          <YAxis stroke="#71717a" fontSize={11} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
            labelStyle={{ color: '#a1a1aa' }}
          />
          <Line type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2} dot={false} name="收入" />
          <Line type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2} dot={false} name="支出" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
