'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, PenLine, BarChart3, CalendarDays, Download, Settings } from 'lucide-react';

interface HubSummary {
  balance: number;
  totalExpense: number;
  todayCount: number;
  todayAmount: number;
  pendingRecurring: number;
}

const entries = [
  { href: '/dashboard', Icon: LayoutDashboard, title: '仪表盘', desc: '收支概览、账户余额与预算进度 →', color: 'from-amber-50 to-orange-50 border-amber-200/60' },
  { href: '/transactions', Icon: PenLine, title: '记账', desc: '日常记录收支与分类管理 →', color: 'from-rose-50 to-pink-50 border-rose-200/60' },
  { href: '/reports', Icon: BarChart3, title: '报表', desc: '支出结构、趋势与环比对比 →', color: 'from-emerald-50 to-teal-50 border-emerald-200/60' },
  { href: '/recurring', Icon: CalendarDays, title: '周期账单', desc: '定期付款与订阅服务管理 →', color: 'from-sky-50 to-blue-50 border-sky-200/60' },
  { href: '/settings?tab=import', Icon: Download, title: '导入账单', desc: '微信 / 支付宝账单导入 →', color: 'from-violet-50 to-purple-50 border-violet-200/60' },
  { href: '/settings', Icon: Settings, title: '设置', desc: '分类、渠道、规则管理 →', color: 'from-stone-50 to-neutral-50 border-stone-200/60' },
];

function summaryLine(href: string, d: HubSummary) {
  switch (href) {
    case '/dashboard': return { text: '本月结余', value: `¥${d.balance.toLocaleString()}`, color: d.balance >= 0 ? 'text-[#2ea87a]' : 'text-[#e25c3b]' };
    case '/transactions': return { text: `今日 ${d.todayCount} 笔`, value: `¥${d.todayAmount.toLocaleString()}`, color: 'text-[#e25c3b]' };
    case '/reports': return { text: '本月支出', value: `¥${d.totalExpense.toLocaleString()}`, color: 'text-[#f59e0b]' };
    case '/recurring': return { text: '进行中', value: `${d.pendingRecurring} 笔`, color: 'text-[#6366f1]' };
    default: return null;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [zooming, setZooming] = useState<string | null>(null);
  const [hubData, setHubData] = useState<HubSummary | null>(null);

  const loadHub = useCallback(() => {
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/recurring-rules').then(r => r.json()),
    ]).then(([dash, rules]) => {
      const today = new Date().toISOString().slice(0, 10);
      const todayTxns = (dash.recent || []).filter((t: any) => t.date === today);
      setHubData({
        balance: dash.balance || 0,
        totalExpense: dash.totalExpense || 0,
        todayCount: todayTxns.length,
        todayAmount: todayTxns.reduce((s: number, t: any) => s + t.amount, 0),
        pendingRecurring: (rules || []).filter((r: any) => r.isActive).length,
      });
    });
  }, []);

  useEffect(() => { loadHub(); }, [loadHub]);

  // Refresh hub data when transactions are created elsewhere
  useEffect(() => {
    const handler = () => loadHub();
    window.addEventListener('transaction-created', handler);
    return () => window.removeEventListener('transaction-created', handler);
  }, [loadHub]);

  // Prefetch linked pages on mount to reduce first-click lag
  useEffect(() => {
    entries.forEach(e => router.prefetch(e.href));
  }, [router]);

  const handleClick = useCallback((href: string) => {
    setZooming(href);
    // Let zoom-out CSS play for 200ms, then navigate with View Transition crossfade
    setTimeout(() => {
      ('startViewTransition' in document)
        ? (document as any).startViewTransition(() => router.push(href))
        : router.push(href);
    }, 200);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-3">
      <div className={`text-center mb-5 transition-all duration-300 ${zooming ? 'opacity-0 scale-90' : 'animate-slide-down'}`}>
        <h1 className="text-2xl font-bold text-[#3d342b] mb-0.5">账单管理</h1>
        <p className="text-[11px] text-[#6b5d52]">
          个人财务助手 · {new Date().getFullYear()}年{new Date().getMonth() + 1}月
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {entries.map((e, i) => {
          const active = zooming === e.href;
          const dimmed = zooming && !active;
          const s = hubData && summaryLine(e.href, hubData);
          const Icon = e.Icon;

          return (
            <button
              key={e.href}
              onClick={() => handleClick(e.href)}
              disabled={!!zooming}
              className={`bg-gradient-to-br ${e.color} border rounded-2xl p-4 flex flex-col items-center text-center gap-1.5
                transition-all duration-300 ease-out cursor-pointer
                ${active ? 'scale-[1.8] opacity-0 z-10 relative' : ''}
                ${dimmed ? 'opacity-0 scale-75' : ''}
                ${!zooming ? 'animate-scale-in hover:scale-[1.04] hover:shadow-lg hover:-translate-y-1' : 'cursor-default'}
              `}
              style={{ animationDelay: !zooming ? `${(i + 1) * 0.05}s` : '0s', animationFillMode: 'both' }}
            >
              <Icon size={28} strokeWidth={1.5} className="text-[#3d342b]" />
              <span className="font-semibold text-[#3d342b] text-sm">{e.title}</span>
              <span className="text-[11px] text-[#6b5d52] leading-snug">{e.desc}</span>
              {s && (
                <span className="text-[11px] text-[#6b5d52]">
                  {s.text} <span className={`font-bold ${s.color}`}>{s.value}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
