'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/TrendChart';
import TransactionList from '@/components/TransactionList';

export default function DashboardPage() {
  const [data, setData] = useState<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    trend: { date: string; income: number; expense: number }[];
    recent: {
      id: string;
      type: string;
      amount: number;
      date: string;
      note?: string | null;
      category: { name: string; icon: string };
      channel: { name: string };
    }[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <div className="text-zinc-500 p-8">加载中...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">📊 仪表盘</h2>

      <div className="flex gap-4 mb-6 flex-wrap">
        <StatCard title="本月收入" value={`+${data.totalIncome.toLocaleString()}`} color="green" />
        <StatCard title="本月支出" value={`-${data.totalExpense.toLocaleString()}`} color="red" />
        <StatCard title="本月结余" value={data.balance.toLocaleString()} color="blue" />
      </div>

      <TrendChart data={data.trend} />

      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">最近流水</h3>
        <TransactionList transactions={data.recent} />
      </div>
    </div>
  );
}
