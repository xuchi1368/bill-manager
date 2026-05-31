'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIconTheme } from '@/components/IconProvider';
import { getIconKey } from '@/lib/icon-themes';

interface Budget {
  id: string; name: string; icon: string;
  budgetLimit: number; spent: number; lastMonthSpent?: number;
}

interface ExpenseCategory {
  id: string; name: string; icon: string; budgetLimit: number | null;
}

interface Props {
  budgets: Budget[];
  allExpenseCategories: ExpenseCategory[];
}

/** 可关闭超支横幅 */
function BudgetAlertBanner({ alerts }: { alerts: { name: string; icon: string; spent: number; limit: number }[] }) {
  const today = new Date().toISOString().split('T')[0];
  const key = `budget-banner-${today}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem(key)) setDismissed(true); } catch {}
  }, [key]);

  if (dismissed || alerts.length === 0) return null;

  const overItems = alerts.filter(a => a.spent > a.limit);
  const nearItems = alerts.filter(a => a.spent <= a.limit);

  return (
    <div className="budget-banner" style={{
      background: overItems.length > 0 ? 'linear-gradient(135deg, #fef2f2, #fff5f5)' : 'linear-gradient(135deg, #fffbeb, #fffbf0)',
      border: '1px solid ' + (overItems.length > 0 ? '#fde1d5' : '#fef3e0'),
      borderRadius: 10, padding: '8px 14px', marginBottom: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 13, animation: 'slideDown 0.3s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span>⚠️</span>
        <span style={{ fontWeight: 600, color: overItems.length > 0 ? '#e25c3b' : '#f59e0b' }}>超支提醒：</span>
        {overItems.map(a => (
          <span key={a.name}>{a.icon} {a.name}超支 <strong style={{ color: '#e25c3b' }}>¥{(a.spent - a.limit).toFixed(0)}</strong></span>
        ))}
        {overItems.length > 0 && nearItems.length > 0 && <span style={{ color: '#d6cec4' }}>|</span>}
        {nearItems.map(a => (
          <span key={a.name}>{a.icon} {a.name}剩 <strong style={{ color: '#f59e0b' }}>¥{(a.limit - a.spent).toFixed(0)}</strong></span>
        ))}
      </div>
      <button
        onClick={() => { setDismissed(true); try { localStorage.setItem(key, '1'); } catch {} }}
        style={{ background: 'none', border: '1px solid #d6cec4', borderRadius: 6, padding: '2px 8px', fontSize: 13, color: '#6b5d52', cursor: 'pointer' }}
      >✕ 关闭</button>
    </div>
  );
}

/** 环形 SVG 辅助组件 */
function Ring({ size, strokeWidth, percentage, color, children }: {
  size: number; strokeWidth: number; percentage: number; color: string; children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, percentage));
  const offset = circumference * (1 - clamped);
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ede6dd" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="ring-circle" />
      </svg>
      {children}
    </div>
  );
}

/** 总预算环 */
function TotalBudgetRing({ totalSpent, totalLimit }: { totalSpent: number; totalLimit: number }) {
  const pct = totalLimit > 0 ? totalSpent / totalLimit : 0;
  const remaining = totalLimit - totalSpent;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - new Date().getDate();
  const color = pct >= 1 ? '#e25c3b' : pct >= 0.8 ? '#f59e0b' : '#2ea87a';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #ede6dd' }}>
      <Ring size={80} strokeWidth={6} percentage={pct} color={color}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#3d342b', zIndex: 1 }}>{Math.round(pct * 100)}%</span>
      </Ring>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#3d342b' }}>本月总预算</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#3d342b' }}>
          ¥{totalSpent.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 400, color: '#6b5d52' }}>/ ¥{totalLimit.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 13, color }}>
          {pct >= 1 ? `超支 ¥${Math.abs(remaining).toLocaleString()}` : `剩 ¥${remaining.toLocaleString()}`} · 还剩 {daysLeft} 天
        </div>
      </div>
    </div>
  );
}

/** 单个分类环形卡 */
function CategoryRingCard({ budget }: { budget: Budget }) {
  const { getIcon } = useIconTheme();
  const key = getIconKey(budget.name, budget.icon);
  const pct = budget.budgetLimit > 0 ? budget.spent / budget.budgetLimit : 0;
  const remaining = budget.budgetLimit - budget.spent;

  let ringColor: string, borderColor: string, hintColor: string, hintText: string;
  if (pct >= 1) {
    ringColor = '#e25c3b'; borderColor = '#fde1d5'; hintColor = '#e25c3b'; hintText = `超 ¥${Math.abs(remaining).toFixed(0)}`;
  } else if (pct >= 0.8) {
    ringColor = '#f59e0b'; borderColor = '#fef3e0'; hintColor = '#f59e0b'; hintText = `剩 ¥${remaining.toFixed(0)}`;
  } else {
    ringColor = '#2ea87a'; borderColor = '#e8f5ee'; hintColor = '#2ea87a'; hintText = `剩 ¥${remaining.toFixed(0)}`;
  }

  const monthDiff = budget.lastMonthSpent !== undefined ? budget.spent - budget.lastMonthSpent : null;

  return (
    <div style={{
      background: 'white', borderRadius: 10, padding: '14px 10px', textAlign: 'center',
      border: `1px solid ${borderColor}`, position: 'relative',
    }}>
      {pct >= 1 && (
        <div style={{ position: 'absolute', top: -1, right: -1, background: '#e25c3b', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '0 10px' }}>超支</div>
      )}
      <Ring size={48} strokeWidth={4} percentage={pct} color={ringColor}>
        <div style={{ zIndex: 1 }}>{getIcon(key, 18)}</div>
      </Ring>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#3d342b', marginTop: 6 }}>{budget.name}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#3d342b' }}>¥{budget.spent.toLocaleString()}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: hintColor }}>{hintText}</div>
      {monthDiff !== null && monthDiff !== 0 && (
        <div style={{ fontSize: 11, color: monthDiff > 0 ? '#f59e0b' : '#2ea87a', marginTop: 2 }}>
          {monthDiff > 0 ? '↑' : '↓'} ¥{Math.abs(monthDiff).toFixed(0)} 较上月
        </div>
      )}
    </div>
  );
}

/** 无预算分类卡片（灰色，可点击跳转设置） */
function NoBudgetCard({ cat, onClick }: { cat: ExpenseCategory; onClick: () => void }) {
  const { getIcon } = useIconTheme();
  const key = getIconKey(cat.name, cat.icon);
  return (
    <div onClick={onClick} style={{
      background: 'white', borderRadius: 10, padding: '14px 10px', textAlign: 'center',
      border: '1px solid #ede6dd', cursor: 'pointer', opacity: 0.7,
    }}>
      <Ring size={48} strokeWidth={4} percentage={0} color="#d6cec4">
        <div style={{ zIndex: 1 }}>{getIcon(key, 18)}</div>
      </Ring>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#3d342b', marginTop: 6 }}>{cat.name}</div>
      <div style={{ fontSize: 11, color: '#6b5d52', marginTop: 2 }}>未设预算</div>
    </div>
  );
}

// ============= 主组件 =============
export default function BudgetOverview({ budgets, allExpenseCategories }: Props) {
  const router = useRouter();
  const totalLimit = budgets.reduce((s, b) => s + b.budgetLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  const alerts = budgets
    .filter(b => b.budgetLimit > 0 && b.spent / b.budgetLimit >= 0.8)
    .map(b => ({ name: b.name, icon: b.icon, spent: b.spent, limit: b.budgetLimit }));

  const budgetedIds = new Set(budgets.map(b => b.id));
  const noBudgetCategories = allExpenseCategories.filter(c => c.budgetLimit === null && !budgetedIds.has(c.id));

  if (budgets.length === 0 && noBudgetCategories.length === 0) return null;

  return (
    <div style={{ background: '#faf7f2', borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <BudgetAlertBanner alerts={alerts} />
      {totalLimit > 0 && <TotalBudgetRing totalSpent={totalSpent} totalLimit={totalLimit} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {budgets.map(b => (
          <CategoryRingCard key={b.id} budget={b} />
        ))}
        {noBudgetCategories.map(c => (
          <NoBudgetCard key={c.id} cat={c}
            onClick={() => router.push(`/settings?tab=categories&highlight=${c.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
