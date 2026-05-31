# 预算仪表盘 + 图标主题系统 — 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 仪表盘新增预算可视化区域（总预算环 + 4 列分类环形卡 + 可关闭超支横幅）+ 全站图标主题系统（Lucide/Emoji/色块三套可切换）

**架构：** IconProvider Context 包裹全站 → icon-themes.ts 存三套映射表 → BudgetOverview 组件消费 API 数据渲染 SVG 环 → 设置页提供图标切换入口 + 预算分类 highlight 跳转

**技术栈：** Next.js 14 (App Router), React 18, TypeScript, Prisma + better-sqlite3, Tailwind CSS, Lucide React

**设计规格：** `docs/superpowers/specs/2026-05-31-budget-dashboard-design.md`

---

### 任务 1：搭建图标主题基础设施

**文件：**
- 创建：`src/lib/icon-themes.ts`
- 创建：`src/components/IconProvider.tsx`

- [ ] **步骤 1：编写 icon-themes.ts — 三套图标映射表**

```typescript
// src/lib/icon-themes.ts
import {
  UtensilsCrossed, Car, ShoppingCart, Home, Gamepad2, Pill, Smartphone,
  Gift, Plane, GraduationCap, Briefcase, Wrench, Package, Heart,
  Flame, Coffee, Sandwich, Pizza, CupSoda, Bus, Fuel, Shirt, Sparkles,
  Film, Music, Laptop, Lightbulb, Droplets, BookOpen, Cat, CreditCard,
  Brush, Cake, Dumbbell, Scissors, Building2, Banknote, Landmark,
  MessageCircle, CircleDollarSign, Bitcoin, type LucideIcon
} from 'lucide-react';
import React from 'react';

export type IconTheme = 'lucide' | 'emoji' | 'colored';

// 分类语义 key → 各主题渲染函数
export type IconRenderer = (size?: number) => React.ReactElement;

// ============== Lucide 主题 ==============
const LUCIDE_MAP: Record<string, { icon: LucideIcon; color?: string }> = {
  food:          { icon: UtensilsCrossed },
  transport:     { icon: Car },
  shopping:      { icon: ShoppingCart },
  housing:       { icon: Home },
  entertainment: { icon: Gamepad2 },
  medical:       { icon: Pill },
  communication:{ icon: Smartphone },
  gift:          { icon: Gift },
  travel:        { icon: Plane },
  education:     { icon: GraduationCap },
  income:        { icon: CircleDollarSign },
  investment:    { icon: Landmark },
  digital:       { icon: Laptop },
  beauty:        { icon: Sparkles },
  pet:           { icon: Cat },
  other:         { icon: Package },
};

// ============== Emoji 主题 ==============
const EMOJI_MAP: Record<string, string> = {
  food: '🍜', transport: '🚗', shopping: '🛒', housing: '🏠',
  entertainment: '🎮', medical: '💊', communication: '📱',
  gift: '🎁', travel: '✈️', education: '🎓', income: '💰',
  investment: '📈', digital: '💻', beauty: '💄', pet: '🐱', other: '📦',
};

// ============== Colored 主题（色块 + Lucide 白线图标）==============
const COLORED_COLORS: Record<string, string> = {
  food: '#2ea87a', transport: '#f59e0b', shopping: '#8b5cf6',
  housing: '#6366f1', entertainment: '#e25c3b', medical: '#ec4899',
  communication: '#06b6d4', gift: '#f43f5e', travel: '#14b8a6',
  education: '#3b82f6', income: '#2ea87a', investment: '#a855f7',
  digital: '#0ea5e9', beauty: '#d946ef', pet: '#f97316', other: '#6b5d52',
};

// ============== 分类 emoji → 语义 key 映射 ==============
const CATEGORY_EMOJI_TO_KEY: Record<string, string> = {
  '🍜': 'food', '🍔': 'food', '🍕': 'food', '🥤': 'food', '☕': 'food',
  '🚗': 'transport', '🚌': 'transport', '⛽': 'transport',
  '🛒': 'shopping', '👗': 'shopping', '💄': 'beauty',
  '🎮': 'entertainment', '🎬': 'entertainment', '🎵': 'entertainment',
  '📱': 'digital', '💻': 'digital',
  '🏠': 'housing', '💡': 'housing', '💧': 'housing',
  '📚': 'education', '💊': 'medical', '🐱': 'pet',
  '🎁': 'gift', '✈️': 'travel', '🏥': 'medical', '🎓': 'education',
  '💰': 'income', '📈': 'investment', '💼': 'income', '🏦': 'income',
  '🧾': 'other', '💳': 'other', '🧹': 'other',
  '🎂': 'food', '⚽': 'entertainment', '🏋️': 'entertainment',
  '🧘': 'entertainment', '💇': 'beauty',
  '🔧': 'other', '📦': 'other', '❤️': 'gift', '🌟': 'other', '🔥': 'other',
};

// 分类名 → 语义 key（当分类没有 emoji 时，按名称匹配）
const CATEGORY_NAME_TO_KEY: Record<string, string> = {
  '餐饮': 'food', '交通': 'transport', '购物': 'shopping', '住房': 'housing',
  '娱乐': 'entertainment', '医疗': 'medical', '通讯': 'communication',
  '礼物': 'gift', '旅行': 'travel', '教育': 'education', '工资': 'income',
  '投资收益': 'investment', '数码': 'digital', '美容': 'beauty', '宠物': 'pet',
  '其他收入': 'income', '转账': 'other',
};

export function getIconKey(categoryName: string, categoryIcon?: string): string {
  // 优先用 emoji 查找
  if (categoryIcon && CATEGORY_EMOJI_TO_KEY[categoryIcon]) {
    return CATEGORY_EMOJI_TO_KEY[categoryIcon];
  }
  // 其次按名称查找
  if (CATEGORY_NAME_TO_KEY[categoryName]) {
    return CATEGORY_NAME_TO_KEY[categoryName];
  }
  return 'other';
}

// 渲染指定主题下的图标
export function renderIcon(theme: IconTheme, key: string, size: number = 16): React.ReactElement {
  switch (theme) {
    case 'lucide': {
      const entry = LUCIDE_MAP[key] || LUCIDE_MAP['other'];
      return React.createElement(entry.icon, { size, strokeWidth: 2 });
    }
    case 'emoji': {
      const emoji = EMOJI_MAP[key] || EMOJI_MAP['other'];
      return React.createElement('span', { style: { fontSize: size } }, emoji);
    }
    case 'colored': {
      const entry = LUCIDE_MAP[key] || LUCIDE_MAP['other'];
      const bg = COLORED_COLORS[key] || COLORED_COLORS['other'];
      return React.createElement('div', {
        style: {
          width: size + 8, height: size + 8, borderRadius: 8,
          backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }
      }, React.createElement(entry.icon, { size: size > 16 ? size - 4 : 12, strokeWidth: 2, color: 'white' }));
    }
  }
}
```

- [ ] **步骤 2：编写 IconProvider.tsx — Context + Hook**

```typescript
// src/components/IconProvider.tsx
'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IconTheme, renderIcon, IconRenderer } from '@/lib/icon-themes';

interface IconContextValue {
  theme: IconTheme;
  setTheme: (t: IconTheme) => void;
  getIcon: (key: string, size?: number) => React.ReactElement | null;
}

const IconContext = createContext<IconContextValue>({
  theme: 'lucide',
  setTheme: () => {},
  getIcon: () => null,
});

export function useIconTheme() {
  return useContext(IconContext);
}

export function IconProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<IconTheme>('lucide');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('icon-theme') as IconTheme | null;
      if (stored === 'lucide' || stored === 'emoji' || stored === 'colored') {
        setThemeState(stored);
      }
    } catch {
      // localStorage 不可用时保持默认 lucide
    }
  }, []);

  const setTheme = useCallback((t: IconTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem('icon-theme', t);
    } catch {
      // ignore
    }
  }, []);

  const getIcon = useCallback((key: string, size?: number) => {
    return renderIcon(theme, key, size);
  }, [theme]);

  return (
    <IconContext.Provider value={{ theme, setTheme, getIcon }}>
      {children}
    </IconContext.Provider>
  );
}
```

- [ ] **步骤 3：验证 TypeScript 编译**

```bash
cd C:\Users\Administrator\bill-manager
npx tsc --noEmit src/lib/icon-themes.ts src/components/IconProvider.tsx 2>&1
```

预期：无错误或仅有项目级配置警告

- [ ] **步骤 4：Commit**

```bash
git add src/lib/icon-themes.ts src/components/IconProvider.tsx
git commit -m "feat: add icon theme system foundation (3 themes: lucide/emoji/colored)"
```

---

### 任务 2：Dashboard API — 补 lastMonthSpent + allExpenseCategories

**文件：**
- 修改：`src/app/api/dashboard/route.ts`

- [ ] **步骤 1：修改 dashboard API**

在 `route.ts` 中，找到 `budgets` 计算逻辑（约第 48-65 行），修改为包含 `lastMonthSpent`。

文件末尾 `return NextResponse.json(...)` 处新增 `allExpenseCategories`。

```typescript
// src/app/api/dashboard/route.ts
// ... 前面代码不变 ...

// 在 budgets 计算后新增 lastMonthSpent
const budgets = await Promise.all(
  expenseCategories.map(async (cat) => {
    const result = await db.transaction.aggregate({
      where: { categoryId: cat.id, type: 'expense', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    });
    // 上月对比
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = lastMonth.toISOString().split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    const lastResult = await db.transaction.aggregate({
      where: { categoryId: cat.id, type: 'expense', date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amount: true },
    });
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      budgetLimit: cat.budgetLimit!,
      spent: result._sum.amount || 0,
      lastMonthSpent: lastResult._sum.amount || 0,
    };
  })
);

// 新增：所有支出分类（用于前端找未设预算的分类）
const allExpenseCategories = await db.category.findMany({
  where: { type: 'expense' },
  select: { id: true, name: true, icon: true, budgetLimit: true },
});

// return 语句中添加 allExpenseCategories
return NextResponse.json({
  totalIncome, totalExpense, balance: totalIncome - totalExpense,
  trend, recent, budgets, accounts, allExpenseCategories,
});
```

- [ ] **步骤 2：验证 API 返回新字段**

```bash
cd C:\Users\Administrator\bill-manager
npx next dev -p 8889 &
sleep 5
curl -s http://localhost:8889/api/dashboard | python3 -c "import sys,json; d=json.load(sys.stdin); print('budgets:', len(d.get('budgets',[])), '| allExpenseCategories:', len(d.get('allExpenseCategories',[]))); [print(f'  {b[\"name\"]}: spent={b[\"spent\"]} lastMonth={b[\"lastMonthSpent\"]}') for b in d.get('budgets',[])]"
```

预期：输出 budgets 数量和 allExpenseCategories 数量，每个 budget 有 `lastMonthSpent` 字段

- [ ] **步骤 3：Commit**

```bash
git add src/app/api/dashboard/route.ts
git commit -m "feat: add lastMonthSpent and allExpenseCategories to dashboard API"
```

---

### 任务 3：BudgetOverview 组件 — 预算可视化核心

**文件：**
- 创建：`src/components/BudgetOverview.tsx`

- [ ] **步骤 1：创建 BudgetOverview 组件（含三个子组件）**

```typescript
// src/components/BudgetOverview.tsx
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
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #ede6dd' }}>
      <Ring size={64} strokeWidth={6} percentage={pct} color={color}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#3d342b', zIndex: 1 }}>{Math.round(pct * 100)}%</span>
      </Ring>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#3d342b' }}>本月总预算</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#3d342b' }}>
          ¥{totalSpent.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: '#6b5d52' }}>/ ¥{totalLimit.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 12, color: color }}>
          {pct >= 1 ? `超支 ¥${Math.abs(remaining).toLocaleString()}` : `剩 ¥${remaining.toLocaleString()}`} · 还剩 {daysLeft} 天
        </div>
      </div>
    </div>
  );
}

/** 单个分类环形卡 */
function CategoryRingCard({ budget, onSetBudget }: { budget: Budget & { lastMonthSpent?: number }; onSetBudget?: (id: string) => void }) {
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
      background: 'white', borderRadius: 10, padding: '12px 8px', textAlign: 'center',
      border: `1px solid ${borderColor}`, position: 'relative',
    }}>
      {pct >= 1 && (
        <div style={{ position: 'absolute', top: -1, right: -1, background: '#e25c3b', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: '0 10px' }}>超支</div>
      )}
      <Ring size={40} strokeWidth={3} percentage={pct} color={ringColor}>
        <div style={{ zIndex: 1 }}>{getIcon(key, 14)}</div>
      </Ring>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#3d342b', marginTop: 4 }}>{budget.name}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#3d342b' }}>¥{budget.spent.toLocaleString()}</div>
      <div style={{ fontSize: 10, fontWeight: 500, color: hintColor }}>{hintText}</div>
      {monthDiff !== null && monthDiff !== 0 && (
        <div style={{ fontSize: 10, color: monthDiff > 0 ? '#f59e0b' : '#2ea87a', marginTop: 2 }}>
          {monthDiff > 0 ? '↑' : '↓'} ¥{Math.abs(monthDiff).toFixed(0)} 较上月
        </div>
      )}
    </div>
  );
}

/** 无预算分类卡片（灰色） */
function NoBudgetCard({ cat, onClick }: { cat: ExpenseCategory; onClick: () => void }) {
  const { getIcon } = useIconTheme();
  const key = getIconKey(cat.name, cat.icon);
  return (
    <div onClick={onClick} style={{
      background: 'white', borderRadius: 10, padding: '12px 8px', textAlign: 'center',
      border: '1px solid #ede6dd', cursor: 'pointer', opacity: 0.7,
    }}>
      <Ring size={40} strokeWidth={3} percentage={0} color="#d6cec4">
        <div style={{ zIndex: 1 }}>{getIcon(key, 14)}</div>
      </Ring>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#3d342b', marginTop: 4 }}>{cat.name}</div>
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
    <div style={{ background: '#faf7f2', borderRadius: 16, padding: 18, marginBottom: 16 }}>
      <BudgetAlertBanner alerts={alerts} />
      {totalLimit > 0 && <TotalBudgetRing totalSpent={totalSpent} totalLimit={totalLimit} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
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
```

- [ ] **步骤 2：验证 TypeScript 编译**

```bash
npx tsc --noEmit src/components/BudgetOverview.tsx 2>&1
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/BudgetOverview.tsx
git commit -m "feat: add BudgetOverview with ring cards, total ring, and dismissible banner"
```

---

### 任务 4：仪表盘页面集成 BudgetOverview

**文件：**
- 修改：`src/app/dashboard/page.tsx`

- [ ] **步骤 1：在仪表盘嵌入 BudgetOverview**

在 `dashboard/page.tsx` 中，找到 `{/* Calendar + Accounts */}` 的 `<div>` 之前（约第 99 行），插入 BudgetOverview。

修改 `data` 类型声明，添加 `allExpenseCategories`。

```typescript
// src/app/dashboard/page.tsx
// 在 useState 的类型声明中添加 allExpenseCategories
const [data, setData] = useState<{
  totalIncome: number; totalExpense: number; balance: number;
  trend: { date: string; income: number; expense: number }[];
  recent: { /* ...不变... */ }[];
  budgets: { id: string; name: string; icon: string; budgetLimit: number; spent: number; lastMonthSpent?: number }[];
  accounts: { /* ...不变... */ }[];
  allExpenseCategories: { id: string; name: string; icon: string; budgetLimit: number | null }[];
} | null>(null);

// 在文件顶部 import 区新增
import BudgetOverview from '@/components/BudgetOverview';

// 在 {/* Calendar + Accounts */} 之前插入：
{/* Budget Overview */}
{data.budgets && data.allExpenseCategories && (
  <BudgetOverview budgets={data.budgets} allExpenseCategories={data.allExpenseCategories} />
)}
```

- [ ] **步骤 2：验证仪表盘页面正常渲染**

```bash
npx next build 2>&1 | tail -10
```

预期：Build 成功

- [ ] **步骤 3：Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: integrate BudgetOverview into dashboard page"
```

---

### 任务 5：icon-map.tsx 重构为 useIconTheme 工厂

**文件：**
- 修改：`src/lib/icon-map.tsx`

- [ ] **步骤 1：重写 icon-map.tsx**

将现有的 category emoji→LucideIcon 映射表替换为使用 useIconTheme 的 hook 版本。

**重要：** 新 API 返回 `ReactElement` 而非 `LucideIcon` 组件类型。所有调用方需从 `<Icon size={14}/>` 改为 `{iconEl}`（直接嵌入 JSX）。

```typescript
// src/lib/icon-map.tsx
'use client';
import React from 'react';
import { useIconTheme } from '@/components/IconProvider';
import { getIconKey } from '@/lib/icon-themes';
import {
  Package, CreditCard, MessageCircle, CircleDollarSign, Banknote, Building2,
  type LucideIcon
} from 'lucide-react';

const CHANNEL_ICON_MAP: Record<string, LucideIcon> = {
  '微信': MessageCircle, '支付宝': CircleDollarSign,
  '银行卡': CreditCard, '现金': Banknote, '工资卡': Building2,
};

// 分类图标 hook — 返回 (emoji, categoryName) → ReactElement
export function useCategoryIcon() {
  const { getIcon } = useIconTheme();
  return (emoji: string, categoryName?: string): React.ReactElement => {
    const key = getIconKey(categoryName || '', emoji);
    return getIcon(key, 16) || React.createElement(Package, { size: 16 });
  };
}

// 渠道图标 hook — 返回 LucideIcon 组件（渠道总是 Lucide 风格）
export function useChannelIcon() {
  return (name: string): LucideIcon => CHANNEL_ICON_MAP[name] || CreditCard;
}

// 保留旧签名给服务端代码（如 API 路由）
export function getChannelIcon(name: string): LucideIcon {
  return CHANNEL_ICON_MAP[name] || CreditCard;
}

export { CHANNEL_ICON_MAP };
```

- [ ] **步骤 2：检查所有调用 icon-map 的组件**

```bash
cd C:\Users\Administrator\bill-manager
grep -rn "getCategoryIcon\|from.*icon-map" src/ --include="*.tsx" --include="*.ts"
```

列出所有使用点，确认后续任务覆盖。

- [ ] **步骤 3：Commit**

```bash
git add src/lib/icon-map.tsx
git commit -m "refactor: rewrite icon-map as useCategoryIcon/useChannelIcon hooks via IconProvider"
```

---

### 任务 6：Layout 包裹 IconProvider + 全部页面迁移图标

**文件：**
- 修改：`src/app/layout.tsx`
- 修改：`src/app/page.tsx`
- 修改：`src/components/TransactionList.tsx`
- 修改：`src/components/TransactionForm.tsx`
- 修改：`src/components/QuickAddPanel.tsx`

- [ ] **步骤 1：Layout 包裹 IconProvider**

```typescript
// src/app/layout.tsx
// 在 import 区添加
import { IconProvider } from '@/components/IconProvider';

// 将 children 包裹在 IconProvider 中
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#faf7f2] text-[#3d342b] antialiased">
        <IconProvider>
          <AppShell>{children}</AppShell>
        </IconProvider>
      </body>
    </html>
  );
}
```

- [ ] **步骤 2：更新首页 — 分类图标迁移**

首页卡片使用 Lucide 图标（UI 图标，非数据图标），不需要改。

- [ ] **步骤 3：更新 TransactionList — 分类列图标改用 hook**

`TransactionList.tsx` 当前用法：`const Icon = getCategoryIcon(t.category.icon); <Icon size={14} />`

改为：
```typescript
import { useCategoryIcon } from '@/lib/icon-map';
// 组件内：
const catIcon = useCategoryIcon();
// JSX 中替换 <Icon size={14} /> 为：
{catIcon(t.category.icon, t.category.name)}
```

- [ ] **步骤 4：更新 TransactionForm — 分类选择器图标**

类似 TransactionList，在组件内添加 `const catIcon = useCategoryIcon()`，将分类选项的图标渲染从 `<IconComponent size={14}/>` 改为 `{catIcon(c.icon, c.name)}`。

- [ ] **步骤 5：更新 QuickAddPanel — 分类网格图标**

在 `QuickAddPanel.tsx` 的分类网格部分，添加 `const catIcon = useCategoryIcon()`，将每个分类按钮的图标从 `<IconComp size={20}/>` 改为 `{catIcon(c.icon, c.name)}`。

- [ ] **步骤 6：验证编译**

```bash
npx next build 2>&1 | tail -5
```

预期：Build 成功

- [ ] **步骤 7：Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/TransactionList.tsx src/components/TransactionForm.tsx src/components/QuickAddPanel.tsx
git commit -m "feat: wrap app in IconProvider; migrate category icons to useCategoryIcon hook"
```

---

### 任务 7：设置页 — 图标主题切换 + 分类 highlight 跳转

**文件：**
- 修改：`src/app/settings/page.tsx`

- [ ] **步骤 1：在 categories tab 上方添加图标主题切换器**

在 settings/page.tsx 中，找到 `{tab === 'categories' && (` (约第 321 行)。在 `<div>` 的开头（第一个 `card p-4` 之前）插入主题切换 UI：

```typescript
// 在 SettingsContent 组件内，return 之前（tab === 'categories' 的 div 开头）
import { useIconTheme } from '@/components/IconProvider';

// 在组件顶部：
const { theme, setTheme } = useIconTheme();

// 在 categories tab 内容区最前面添加：
{tab === 'categories' && (
  <div className="card p-3 mb-4 flex items-center gap-3">
    <span className="text-xs text-[#6b5d52] font-medium">图标风格：</span>
    {(['lucide', 'emoji', 'colored'] as const).map(t => (
      <button
        key={t}
        onClick={() => setTheme(t)}
        className={`px-3 py-1.5 text-xs rounded-[8px] font-medium transition-all cursor-pointer ${
          theme === t
            ? 'bg-[#f59e0b] text-white shadow-sm'
            : 'bg-[#f5f2ed] text-[#6b5d52] hover:bg-[#ede6dd]'
        }`}
      >
        {t === 'lucide' ? '🔲 Lucide 线性' : t === 'emoji' ? '😀 Emoji' : '🎨 色块图标'}
      </button>
    ))}
  </div>
)}
```

- [ ] **步骤 2：实现 highlight 跳转逻辑**

在 settings/page.tsx 的 `SettingsContent` 组件顶部：

```typescript
// 在 useEffect 中处理 highlight 参数
useEffect(() => {
  const highlightId = searchParams.get('highlight');
  if (highlightId && tab === 'categories') {
    // 延迟以确保 DOM 渲染完成
    setTimeout(() => {
      const el = document.getElementById(`category-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 添加临时高亮动画
        el.style.boxShadow = '0 0 0 3px #f59e0b';
        el.style.borderRadius = '8px';
        el.style.transition = 'box-shadow 0.3s';
        setTimeout(() => { el.style.boxShadow = ''; }, 2000);
      }
    }, 300);
  }
}, [searchParams, tab]);
```

同时在分类列表的每个 `<div key={c.id}>` 上添加 `id={`category-${c.id}`}`：

```typescript
// 修改分类列表渲染
{expenseCategories.map((c) => (
  <div key={c.id} id={`category-${c.id}`} className="card p-3 flex items-center justify-between">
    <span className="text-[#3d342b]">{c.icon} {c.name}</span>
    {/* ... 预算输入框和删除按钮不变 ... */}
  </div>
))}
```

- [ ] **步骤 3：验证新增 UI 不报错**

```bash
npx tsc --noEmit src/app/settings/page.tsx 2>&1
```

- [ ] **步骤 4：Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add icon theme switcher in settings + category highlight navigation"
```

---

### 任务 8：CSS 动画补充

**文件：**
- 修改：`src/app/globals.css`

- [ ] **步骤 1：添加环形 SVG 动画 + 横幅动画 + 图标主题辅助样式**

在 `globals.css` 的 `@layer base` 之后添加 `@layer components`：

```css
/* src/app/globals.css — 在 @layer base 之后添加 */

@layer components {
  /* 预算横幅滑入动画 */
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .budget-banner {
    animation: slideDown 0.3s ease-out;
  }

  /* 环形 SVG 过渡（百分比变化时平滑动画） */
  .ring-circle {
    transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
  }
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/app/globals.css
git commit -m "style: add budget ring and banner slide animations"
```

---

### 任务 9：端到端验证

**文件：** 无新建，全量验证

- [ ] **步骤 1：生产构建**

```bash
cd C:\Users\Administrator\bill-manager
npx next build 2>&1
```

预期：全部 22 页面编译成功，0 error

- [ ] **步骤 2：启动 dev 服务器并验证 API**

```bash
npx next dev -p 8890 &
sleep 5

# 验证 API 返回新字段
curl -s http://localhost:8890/api/dashboard | python3 -c "
import sys, json
d = json.load(sys.stdin)
assert 'allExpenseCategories' in d, 'missing allExpenseCategories'
assert len(d['allExpenseCategories']) > 0, 'allExpenseCategories is empty'
for b in d.get('budgets', []):
    assert 'lastMonthSpent' in b, f'missing lastMonthSpent in {b[\"name\"]}'
print('✅ API verification passed')
print(f'  budgets: {len(d[\"budgets\"])} items')
print(f'  allExpenseCategories: {len(d[\"allExpenseCategories\"])} items')
for b in d.get('budgets', []):
    print(f'  {b[\"name\"]}: spent={b[\"spent\"]} limit={b[\"budgetLimit\"]} lastMonth={b[\"lastMonthSpent\"]}')
"
```

预期：✅ 显示 budgets 和 allExpenseCategories 数据

- [ ] **步骤 3：验证 TypeScript 无编译错误**

```bash
cd C:\Users\Administrator\bill-manager
npx tsc --noEmit 2>&1 | head -20
```

预期：无类型错误（或仅有项目级无关警告）

- [ ] **步骤 4：验证前端页面可访问**

```bash
curl -s http://localhost:8890/dashboard | head -5
curl -s http://localhost:8890/settings | head -5
```

预期：返回 HTML（页面可渲染）

- [ ] **步骤 5：清理并 commit 验证记录**

```bash
kill $(lsof -ti:8890) 2>/dev/null
git add -A
git commit -m "verify: end-to-end build + API validation passed for budget dashboard"
```

---

### 任务 10：Electron 打包验证（可选，视时间）

- [ ] **步骤 1：生产构建 + Electron 打包**

```bash
cd C:\Users\Administrator\bill-manager
npx next build && \
ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" \
ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/" \
CSC_IDENTITY_AUTO_DISCOVERY=false \
npx electron-builder --win 2>&1 | tail -5
```

预期：生成 `dist-electron/账单管理 Setup 0.1.0.exe`
