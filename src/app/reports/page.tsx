'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageTransition from '@/components/PageTransition';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/TrendChart';
import CategoryPieChart from '@/components/CategoryPieChart';
import ChannelChart from '@/components/ChannelChart';
import { LoadingSkeleton, ErrorState } from '@/components/PageState';

function fmtMonth(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

function monthRange(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const end = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
  return { start, end };
}

const tooltipStyle = { background: '#ffffff', border: '1px solid #ede6dd', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

export default function ReportsPage() {
  const now = new Date();
  const [yearMonth, setYearMonth] = useState(fmtMonth(now));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (ym: string) => {
    setLoading(true);
    setError('');
    try {
      const { start, end } = monthRange(ym);
      const res = await fetch(`/api/reports?startDate=${start}&endDate=${end}`);
      if (!res.ok) throw new Error('请求失败');
      setData(await res.json());
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(yearMonth); }, [yearMonth, load]);

  function prevMonth() {
    const [y, m] = yearMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setYearMonth(fmtMonth(d));
  }

  const expensePie = data?.categoryDistribution
    ?.filter((c: any) => c.expense > 0)
    ?.map((c: any) => ({ name: `${c.icon} ${c.name}`, value: c.expense, icon: c.icon })) || [];

  const incomePie = data?.categoryDistribution
    ?.filter((c: any) => c.income > 0)
    ?.map((c: any) => ({ name: `${c.icon} ${c.name}`, value: c.income, icon: c.icon })) || [];

  function nextMonth() {
    const [y, m] = yearMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setYearMonth(fmtMonth(d));
  }

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#3d342b] tracking-tight">报表分析</h2>
          <p className="caption mt-0.5">支出结构、趋势变化与环比对比</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={prevMonth} className="px-2 py-1 bg-[#f5f2ed] rounded-lg text-[#6b5d52] hover:text-[#3d342b] text-xs font-medium transition-colors">◀</button>
          <span className="text-[13px] text-[#3d342b] font-semibold min-w-[70px] text-center">{yearMonth}</span>
          <button onClick={nextMonth} disabled={yearMonth >= fmtMonth(now)}
            className="px-2 py-1 bg-[#f5f2ed] rounded-lg text-[#6b5d52] hover:text-[#3d342b] text-xs font-medium disabled:opacity-30 transition-colors">▶</button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => load(yearMonth)} />}
      {loading && !error && <LoadingSkeleton rows={5} />}

      {!loading && !error && (<>
      {/* Stats */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <StatCard title="总收入" amount={data.totalIncome} prefix="+" color="green" />
        <StatCard title="总支出" amount={data.totalExpense} prefix="-" color="red" />
        <StatCard title="结余" amount={data.balance} color="blue" />
      </div>

      {/* Pie charts — expense + income combined in one card */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-3 mb-4">
        <div className="card p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h3 className="section-title text-xs mb-1">支出分类</h3>
              <CategoryPieChart data={expensePie} title="" />
            </div>
            <div>
              <h3 className="section-title text-xs mb-1">收入分类</h3>
              <CategoryPieChart data={incomePie} title="" />
            </div>
          </div>
        </div>
        {data.momComparison && data.momComparison.length > 0 && (
          <div className="card p-3">
            <h3 className="section-title text-xs mb-2">📅 环比（本月 vs 上月）</h3>
            <ResponsiveContainer width="100%" height={Math.min(200, Math.max(120, data.momComparison.length * 24))}>
              <BarChart data={data.momComparison} layout="vertical" barCategoryGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ede6dd" />
                <XAxis type="number" stroke="#6b5d52" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#6b5d52" fontSize={12} width={50} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`¥${Number(v).toLocaleString()}`, '']} />
                <Bar dataKey="previous" fill="#d6cec4" radius={[0, 2, 2, 0]} name="上月" />
                <Bar dataKey="current" fill="#f97316" radius={[0, 2, 2, 0]} name="本月" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {data.momComparison.map((m: any) => (
                <span key={m.name} className={`caption text-[10px] px-1.5 py-0.5 rounded-[4px] ${m.change > 0 ? 'bg-rose-50 text-[#e25c3b]' : m.change < 0 ? 'bg-emerald-50 text-[#2ea87a]' : 'bg-[#f5f2ed] text-[#6b5d52]'}`}>
                  {m.name} {m.change > 0 ? '↑' : m.change < 0 ? '↓' : '→'}{Math.abs(m.change)}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Channel + Trend */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-3">
        <ChannelChart data={data.channelDistribution} />
        <TrendChart data={data.dailyTrend} title="每日收支趋势" compact />
      </div>
      </>)}
    </PageTransition>
  );
}
