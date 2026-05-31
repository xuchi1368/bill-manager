'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

interface TrendData { date: string; income: number; expense: number; }

const tooltipStyle = { background: '#ffffff', border: '1px solid #ede6dd', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: '10px 14px' };

export default function TrendChart({ data, title = '收支趋势', compact }: { data: TrendData[]; title?: string; compact?: boolean }) {
  if (!data.length) return <div className="card p-5 text-sm text-[#6b5d52]">暂无趋势数据</div>;

  // Compute cumulative net worth
  let running = 0;
  const enriched = data.map(d => {
    running += d.income - d.expense;
    return {
      ...d,
      net: d.income - d.expense,
      cumulative: running,
      label: d.date.slice(5),
    };
  });

  const totalIncome = enriched.reduce((s, d) => s + d.income, 0);
  const totalExpense = enriched.reduce((s, d) => s + d.expense, 0);
  const netGrowth = enriched[enriched.length - 1]?.cumulative || 0;

  // Find significant days for annotation
  const bigIncomeDay = enriched.reduce((m, d) => d.income > m.val ? { val: d.income, label: d.label, cumulative: d.cumulative } : m, { val: 0, label: '', cumulative: 0 });
  const bigExpenseDay = enriched.reduce((m, d) => d.expense > m.val ? { val: d.expense, label: d.label, cumulative: d.cumulative } : m, { val: 0, label: '', cumulative: 0 });

  return (
    <div className={`card ${compact ? 'p-3' : 'p-5'}`}>
      {/* Title + hero number */}
      <div className="flex items-end justify-between mb-1">
        <div>
          <h3 className={`font-semibold text-[#3d342b] ${compact ? 'text-[13px]' : 'text-sm'}`}>{title}</h3>
          <p className="text-[11px] text-[#6b5d52] mt-0.5">累计净值走势</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-extrabold tracking-tight ${netGrowth >= 0 ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}>
            {netGrowth >= 0 ? '+' : ''}¥{Math.abs(netGrowth).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#6b5d52]">本月净增长</div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={compact ? 160 : 200}>
        <AreaChart data={enriched} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cumulativeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2ea87a" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2ea87a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f2ed" vertical={false} />
          <XAxis dataKey="label" stroke="#6b5d52" fontSize={12} tickLine={false} axisLine={{ stroke: '#f5f2ed' }} />
          <YAxis stroke="#6b5d52" fontSize={12} tickLine={false} axisLine={false}
            tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : String(v)}
            width={40}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={((value: any, name: any) => {
              const v = Number(value) || 0;
              if (name === 'cumulative') return [<span key="v" style={{fontWeight:700,color:v>=0?'#2ea87a':'#e25c3b'}}>¥{v.toLocaleString()}</span>, '累计净值'];
              if (name === 'income') return [`+¥${v.toLocaleString()}`, '当日收入'];
              return [`-¥${v.toLocaleString()}`, '当日支出'];
            }) as any}
            labelFormatter={((label: any) => <span style={{color:'#3d342b',fontWeight:600}}>{label}</span>) as any}
            separator="："
          />
          {/* Zero baseline */}
          <CartesianGrid stroke="#ede6dd" strokeDasharray="4 3" />

          {/* Cumulative area */}
          <Area type="monotone" dataKey="cumulative" stroke="#2ea87a" strokeWidth={2.5}
            fill="url(#cumulativeGrad)" dot={false} name="累计净值" />

          {/* Reference dots on significant days */}
          {bigIncomeDay.label && bigIncomeDay.val >= 500 && (
            <ReferenceDot x={bigIncomeDay.label} y={bigIncomeDay.cumulative}
              r={5} fill="#2ea87a" stroke="#fff" strokeWidth={2.5} />
          )}
          {bigExpenseDay.label && bigExpenseDay.val >= 500 && (
            <ReferenceDot x={bigExpenseDay.label} y={bigExpenseDay.cumulative}
              r={5} fill="#e25c3b" stroke="#fff" strokeWidth={2.5} />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Event annotations */}
      <div className="flex flex-wrap gap-2 mt-2">
        {bigIncomeDay.label && bigIncomeDay.val >= 500 && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-[#2ea87a] px-2 py-0.5 rounded-full">
            💰 {bigIncomeDay.label} 收入 +¥{bigIncomeDay.val.toLocaleString()}
          </span>
        )}
        {bigExpenseDay.label && bigExpenseDay.val >= 500 && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-rose-50 text-[#e25c3b] px-2 py-0.5 rounded-full">
            📉 {bigExpenseDay.label} 支出 -¥{bigExpenseDay.val.toLocaleString()}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-[#6b5d52] bg-[#f5f2ed] px-2 py-0.5 rounded-full">
          收 ¥{totalIncome.toLocaleString()} · 支 ¥{totalExpense.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
