'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard, ClipboardList } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import TrendChart from '@/components/TrendChart';
import CalendarView from '@/components/CalendarView';
import TransactionList from '@/components/TransactionList';
import QuickAddPanel from '@/components/QuickAddPanel';
import BudgetOverview from '@/components/BudgetOverview';

export default function DashboardPage() {
  const [data, setData] = useState<{
    totalIncome: number; totalExpense: number; balance: number;
    trend: { date: string; income: number; expense: number }[];
    recent: {
      id: string; type: string; amount: number; date: string; note?: string | null;
      categoryId: string; channelId: string;
      category: { name: string; icon: string }; channel: { name: string };
    }[];
    budgets: { id: string; name: string; icon: string; budgetLimit: number; spent: number; lastMonthSpent?: number }[];
    accounts: { id: string; name: string; type: string; balance: number }[];
    allExpenseCategories: { id: string; name: string; icon: string; budgetLimit: number | null }[];
  } | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const loadData = useCallback(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('transaction-created', handler);
    return () => window.removeEventListener('transaction-created', handler);
  }, [loadData]);

  if (!data) return (
    <PageTransition>
      <div className="mb-4"><h2 className="text-[22px] font-bold text-[#3d342b] tracking-tight">仪表盘</h2></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl animate-shimmer" />)}</div>
      <div className="h-48 rounded-2xl animate-shimmer" />
    </PageTransition>
  );

  const topExpense = data.recent.filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
  const savingRate = data.totalIncome > 0 ? Math.round((data.balance / data.totalIncome) * 100) : 0;

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[22px] font-bold text-[#3d342b] tracking-tight">仪表盘</h2>
          <p className="text-[13px] text-[#6b5d52] mt-0.5">{new Date().getFullYear()}年{new Date().getMonth() + 1}月 · 收支总览</p>
        </div>
        <button onClick={() => setShowQuickAdd(!showQuickAdd)}
          className={`text-[13px] font-semibold px-4 py-2 rounded-full transition-all cursor-pointer ${
            showQuickAdd ? 'bg-[#f5f2ed] text-[#6b5d52]' : 'bg-[#f59e0b] text-white hover:bg-amber-500/90 shadow-sm'
          }`}>
          {showQuickAdd ? '收起' : '＋ 记账'}
        </button>
      </div>

      {showQuickAdd && <QuickAddPanel onCreated={() => { loadData(); }} onClose={() => setShowQuickAdd(false)} />}

      {/* Three stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="card p-[18px] animate-slide-up">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={16} strokeWidth={2} className="text-[#2ea87a]" />
            <span className="text-[13px] text-[#6b5d52] font-medium">本月收入</span>
          </div>
          <div className="amount-lg text-[34px] text-[#2ea87a] mb-1">¥{data.totalIncome.toLocaleString()}</div>
          <p className="text-[12px] text-[#6b5d52]">
            {data.trend.filter(d => d.income > 0).length} 笔收入{data.trend.some(d => d.income >= 10000) && ' · 含大额入账'}
          </p>
        </div>
        <div className="card p-[18px] animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={16} strokeWidth={2} className="text-[#e25c3b]" />
            <span className="text-[13px] text-[#6b5d52] font-medium">本月支出</span>
          </div>
          <div className="amount-lg text-[34px] text-[#e25c3b] mb-1">¥{data.totalExpense.toLocaleString()}</div>
          <p className="text-[12px] text-[#6b5d52]">
            {data.recent.filter(t => t.type === 'expense').length} 笔支出
            {topExpense && <> · 最高 <span className="text-[#e25c3b] font-semibold">¥{topExpense.amount.toLocaleString()}</span></>}
          </p>
        </div>
        <div className="card p-[18px] animate-slide-up border-[#fde68a] bg-gradient-to-br from-[#fffdf5] to-[#fffbeb]" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet size={16} strokeWidth={2} className="text-[#92400e]" />
            <span className="text-[13px] text-[#92400e] font-medium">本月结余</span>
          </div>
          <div className="amount-lg text-[34px] text-[#3d342b] mb-1">¥{data.balance.toLocaleString()}</div>
          <p className="text-[12px] text-[#92400e]">
            结余率 {savingRate}%{savingRate >= 50 ? ' · 优秀' : savingRate > 0 && savingRate < 30 ? ' · 注意节制' : ''}
          </p>
        </div>
      </div>

      {/* Budget Overview */}
      {data.budgets && data.allExpenseCategories && (
        <BudgetOverview budgets={data.budgets} allExpenseCategories={data.allExpenseCategories} />
      )}

      {/* Calendar + Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 mb-4">
        <CalendarView />
        <div className="card p-4 flex flex-col">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#3d342b] mb-3">
            <CreditCard size={16} strokeWidth={1.5} />账户余额
          </h3>
          <div className="space-y-2 flex-1">
            {data.accounts.map(a => (
              <div key={a.id} className="flex items-center justify-between py-1">
                <span className="text-[13px] text-[#3d342b]">{a.name}</span>
                <span className="amount text-[13px] font-semibold text-[#3d342b]">¥{a.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#f5f2ed] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#3d342b]">总资产</span>
            <span className="amount-lg text-lg text-[#2ea87a]">
              ¥{data.accounts.reduce((s, a) => s + a.balance, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Trend + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-3">
        <TrendChart data={data.trend} compact />
        <div className="card p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#3d342b]">
              <ClipboardList size={16} strokeWidth={1.5} />最近流水
            </h3>
            <span className="text-[12px] text-[#f59e0b] font-medium cursor-pointer hover:underline">查看全部 →</span>
          </div>
          <TransactionList transactions={data.recent.slice(0, 5)} compact />
        </div>
      </div>
    </PageTransition>
  );
}
