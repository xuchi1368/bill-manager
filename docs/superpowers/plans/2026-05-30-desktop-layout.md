# 桌面端横版布局 实现计划

> **面向 AI 代理的工作者：** 使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将应用从单列移动端布局改造为响应式横版布局——首页卡片展示实时摘要数据，内页在桌面端使用双栏网格。

**架构：** 响应式 Tailwind 方案。`lg:` 断点（1024px）触发宽版布局，向下兼容现有移动端单列。不引入新依赖，不改变路由或 API。

**技术栈：** Next.js 14 App Router, React 18, Tailwind CSS 3, TypeScript

**设计文档：** `docs/superpowers/specs/2026-05-30-desktop-layout-design.md`

---

### 任务 1：布局容器拓宽 + 内页双栏

**文件：**
- 修改：`src/app/layout.tsx:16-17`
- 修改：`src/app/dashboard/page.tsx:63-64, 69-70, 85-86`
- 修改：`src/app/reports/page.tsx:76-79`
- 修改：`src/app/transactions/page.tsx:20-26`

- [x] **步骤 1：layout.tsx 容器加响应式宽度**（v2升级：AppShell + LeftRail 替代 max-w）

将 `layout.tsx` 中 `max-w-4xl` 改为响应式：

```tsx
<div className="max-w-4xl lg:max-w-6xl mx-auto">
```

- [x] **步骤 2：仪表盘页 — 账户余额 + 预算进度双栏**（Calendar+Accounts lg:grid-cols-[2fr_1fr]）

在 `dashboard/page.tsx` 中，将账户余额卡片和预算进度卡片包在一个双栏容器中。找到账户余额区块（约69行）和预算区块（约85行），用以下结构包裹：

```tsx
{/* 双栏：账户 + 预算 */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
  {/* 账户余额卡片 — 原代码 */}
  {data.accounts.length > 0 && (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-[#3d342b] mb-3">💳 账户余额</h3>
      <div className="grid grid-cols-2 gap-3">
        {data.accounts.map((a) => (
          <div key={a.id} className="bg-[#faf7f2] rounded-xl p-3 text-center">
            <div className="text-xs text-[#9c8b7e] mb-1">{a.name}</div>
            <div className={`text-lg font-bold ${a.balance >= 0 ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}>
              ¥{a.balance.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* 预算进度卡片 — 原代码 */}
  {data.budgets.length > 0 && (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-[#3d342b] mb-3">💰 本月预算</h3>
      <div className="space-y-3">
        {data.budgets.map((b) => {
          const pct = Math.min((b.spent / b.budgetLimit) * 100, 100);
          const over = b.spent > b.budgetLimit;
          const warn = pct >= 80 && !over;
          return (
            <div key={b.id} className="flex items-center gap-3">
              <span className="text-lg">{b.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#3d342b]">{b.name}</span>
                  <span className={over ? 'text-[#e25c3b]' : warn ? 'text-amber-600' : 'text-[#9c8b7e]'}>
                    ¥{b.spent.toLocaleString()} / ¥{b.budgetLimit.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-[#f5f2ed] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? 'bg-[#e25c3b]' : warn ? 'bg-amber-500' : 'bg-[#2ea87a]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}
</div>
```

**关键：** 原代码中账户和预算区块是独立平级的，现在用 `<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">` 包裹它们。如果其中一个不存在（空数组），另一个独占整行（`grid-cols-1` 的行为）。

- [x] **步骤 3：报表页 — 饼图双栏确认**（xl:grid-cols-[1fr_1fr_1.2fr] + [1fr_1.5fr]）

`reports/page.tsx` 第 77 行已有 `md:grid-cols-2`，确认保留即可（`md:` 在 768px 已起效，桌面端也生效）。环比对比和渠道分布保持现有布局，不额外拆分。

- [x] **步骤 4：记账页 — 表单 + 列表双栏**（lg:grid-cols-[420px_1fr]）

修改 `transactions/page.tsx`，在桌面端将表单和列表左右排列：

```tsx
return (
  <PageTransition>
    <TopBar title="记账" />
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      <TransactionForm onCreated={load} />
      <TransactionList transactions={transactions} />
    </div>
  </PageTransition>
);
```

- [x] **步骤 5：Build 验证**（next build 通过，全部页面静态生成）

```bash
npx next build 2>&1 | tail -5
```

预期：编译成功，无 TypeScript 错误。

---

### 任务 2：首页 Hub 卡片实时摘要数据

**文件：**
- 修改：`src/app/page.tsx`

- [x] **步骤 1：添加数据 fetch + 摘要状态**（HubData interface + useEffect 双 fetch）

将 `page.tsx` 改为同时获取 dashboard 数据。在文件顶部增加 fetch 逻辑：

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HubData {
  balance: number;
  totalExpense: number;
  todayCount: number;
  todayAmount: number;
  pendingRecurring: number;
}

const entries = [
  {
    href: '/dashboard',
    icon: '📊',
    title: '仪表盘',
    desc: '查看收支概览、账户余额与预算进度',
    color: 'from-amber-50 to-orange-50 border-amber-200/60',
  },
  {
    href: '/transactions',
    icon: '📝',
    title: '记账',
    desc: '记录日常收支、快速记账与分类管理',
    color: 'from-rose-50 to-pink-50 border-rose-200/60',
  },
  {
    href: '/reports',
    icon: '📈',
    title: '报表',
    desc: '分析支出结构、趋势变化与环比对比',
    color: 'from-emerald-50 to-teal-50 border-emerald-200/60',
  },
  {
    href: '/recurring',
    icon: '📅',
    title: '周期账单',
    desc: '管理定期付款、订阅服务与重复账单',
    color: 'from-sky-50 to-blue-50 border-sky-200/60',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [zooming, setZooming] = useState<string | null>(null);
  const [hubData, setHubData] = useState<HubData | null>(null);

  useEffect(() => {
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

  const handleClick = useCallback((href: string) => {
    setZooming(href);
    setTimeout(() => router.push(href), 400);
  }, [router]);

  // 摘要文案
  const summary = (href: string) => {
    if (!hubData) return null;
    switch (href) {
      case '/dashboard':
        return <span className="text-xs text-[#9c8b7e]">本月结余 <span className={`font-bold ${hubData.balance >= 0 ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}>¥{hubData.balance.toLocaleString()}</span></span>;
      case '/transactions':
        return <span className="text-xs text-[#9c8b7e]">今日 <span className="font-bold text-[#e25c3b]">{hubData.todayCount} 笔</span> · ¥{hubData.todayAmount.toLocaleString()}</span>;
      case '/reports':
        return <span className="text-xs text-[#9c8b7e]">本月支出 <span className="font-bold text-[#f59e0b]">¥{hubData.totalExpense.toLocaleString()}</span></span>;
      case '/recurring':
        return <span className="text-xs text-[#9c8b7e]">进行中 <span className="font-bold text-[#6366f1]">{hubData.pendingRecurring} 笔</span></span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] -mt-12">
      <div className={`text-center mb-12 transition-all duration-400 ${zooming ? 'opacity-0 scale-90' : 'animate-slide-down'}`}>
        <h1 className="text-3xl font-bold text-[#3d342b] mb-2">💰 账单管理</h1>
        <p className="text-sm text-[#9c8b7e]">
          个人财务助手 · {new Date().getFullYear()}年{new Date().getMonth() + 1}月
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 w-full max-w-lg">
        {entries.map((e, i) => {
          const active = zooming === e.href;
          const dimmed = zooming && !active;

          return (
            <button
              key={e.href}
              onClick={() => handleClick(e.href)}
              disabled={!!zooming}
              className={`bg-gradient-to-br ${e.color} border rounded-2xl p-6 flex flex-col items-center text-center gap-3
                transition-all duration-400 ease-out
                ${active ? 'scale-[1.8] opacity-0 z-10 relative' : ''}
                ${dimmed ? 'opacity-0 scale-75' : ''}
                ${!zooming ? 'animate-scale-in hover:scale-[1.04] hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'cursor-default'}
              `}
              style={{
                animationDelay: !zooming ? `${(i + 1) * 0.05}s` : '0s',
                animationFillMode: 'both'
              }}
            >
              <span className="text-4xl transition-transform duration-300">{e.icon}</span>
              <span className="font-semibold text-[#3d342b] text-sm">{e.title}</span>
              <span className="text-xs text-[#9c8b7e] leading-relaxed">{e.desc}</span>
              {hubData && summary(e.href)}
            </button>
          );
        })}
      </div>

      <Link href="/settings" className={`mt-10 text-sm text-[#9c8b7e] hover:text-[#3d342b] transition-all duration-400 flex items-center gap-1.5 ${zooming ? 'opacity-0' : 'animate-fade-in'}`} style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        <span className="text-base">⚙️</span> 设置
      </Link>
    </div>
  );
}
```

- [x] **步骤 2：Build 验证**（next build 通过）

```bash
npx next build 2>&1 | tail -5
```

预期：编译成功，无 TypeScript 错误。

---

### 任务 3：最终验证

- [x] **步骤 1：启动生产环境确认**（localhost:3099 200 OK，API 正常返回数据）

```bash
npx next build && npx next start -p 3099 &
```

- [x] **步骤 2：验证检查清单**（API 数据正常，需用户浏览器验证视觉效果）

| 页面 | 检查项 |
|------|--------|
| 首页 | 4 张卡片显示实时数字（结余/今日笔数/月支出/周期数） |
| 首页 | 点击卡片走入画面动画正常 |
| 仪表盘 | 桌面端(≥1024px)账户+预算左右双栏 |
| 报表 | 桌面端饼图左右双栏 |
| 记账 | 桌面端表单左、列表右 |
| 所有页 | 缩窄窗口 <1024px 恢复单列 |
| 所有页 | 动画完整保留 |
