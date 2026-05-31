# 预算仪表盘 + 图标主题系统 — 设计规格

**日期**: 2026-05-31
**状态**: 已批准
**参考**: 随手记、YNAB、Mint、鲨鱼记账的预算 UI 模式

---

## 1. 概述

### 问题
- 后端已有 `Category.budgetLimit` 字段 + Dashboard API 返回 `budgets` 数组
- 仪表盘**完全没有展示预算信息**——设了预算但看不到进度，等于没有
- 设置页分类图标仍用 emoji，与全站 Lucide 化不统一

### 目标
1. 仪表盘新增预算可视化区域（总预算环 + 分类环形卡 + 超支横幅）
2. 全站图标改为可切换的多主题系统（Lucide / Emoji / 色块图标），设置页提供切换入口
3. 未设预算的分类可一键跳转设置
4. 月度对比（本月 vs 上月同一分类）

---

## 2. 架构

### 文件变更清单

```
新增 (3):
  src/components/BudgetOverview.tsx        预算区域容器 + 内部子组件
  src/components/IconProvider.tsx          图标主题 Context + useIconTheme() Hook
  src/lib/icon-themes.ts                   3 套图标映射表（Lucide / Emoji / Colored）

修改 (7):
  src/app/dashboard/page.tsx              嵌入 <BudgetOverview>（三张 StatCard 下方）
  src/app/api/dashboard/route.ts           预算数据补”上月对比”字段 + 返回 allExpenseCategories
  src/app/settings/page.tsx               图标主题切换 UI + 分类图标统一换
                                          支持 URL ?highlight=categoryId 滚动定位
  src/app/layout.tsx                       包裹 <IconProvider>
  src/lib/icon-map.tsx                     重写为调用 useIconTheme() 的工厂函数
  src/app/globals.css                      环形 SVG 动画 + 横幅进出动画 + 3 套图标样式
  src/app/page.tsx                         分类图标从硬编码 Lucide → useIconTheme()
```

### 组件树

```
<IconProvider>                              ← layout.tsx
  <DashboardPage>
    <StatCard /> ×3                         ← 不动
    <BudgetOverview>                        ← 新增
      <BudgetAlertBanner />                 ← 可关闭横幅
      <TotalBudgetRing />                   ← 大环形 + 总金额
      <div className="grid grid-cols-4">
        <CategoryRingCard /> × N            ← 环形卡 + 文字提示
      </div>
    </BudgetOverview>
    <CalendarView />                        ← 不动
    ...
  </DashboardPage>
</IconProvider>
```

---

## 3. 组件设计

### 3.1 BudgetOverview（容器）

**职责**: 接收 budgets 数组，计算总预算和进度，管理横幅状态

**Props**:
```typescript
interface BudgetOverviewProps {
  budgets: { id: string; name: string; icon: string; budgetLimit: number; spent: number; lastMonthSpent?: number }[];
  allExpenseCategories: { id: string; name: string; icon: string; budgetLimit: number | null }[];
  // ↑ 来自 API 返回的新字段，包含所有支出分类（含未设预算的）
```

**状态**:
- `bannerDismissed: boolean` — 从 localStorage 读 `budget-banner-{YYYY-MM-DD}`

**逻辑**:
1. 过滤 `budgets` 中 `spent / budgetLimit >= 0.8` 的分类 → 触发横幅
2. 计算总预算 = Σ budgetLimit，总支出 = Σ spent，百分比
3. 未设预算的分类从 `allExpenseCategories` 里找（`budgetLimit === null` 且不在 `budgets` 中）

### 3.2 BudgetAlertBanner

**触发条件**: 任一分类 `spent / budgetLimit > 0.8`
**位置**: BudgetOverview 顶部
**内容**: "⚠️ 超支提醒：🎮 娱乐超支 ¥30 | 🚗 交通即将超支，剩 ¥120"
**行为**:
- 页面加载时出现，带 slide-down 动画
- 点击 ✕ 关闭，写入 localStorage `budget-banner-{date} = 'dismissed'`
- 同一天内不再出现
- 下次触发条件满足（新的一天或新增超支分类）重新出现

**颜色**:
- 超支（>100%）: 红色底 `#fef2f2`，文字 `#e25c3b`
- 即将超支（80-100%）: 黄色底 `#fffbeb`，文字 `#f59e0b`

### 3.3 TotalBudgetRing

**显示**: 左侧 SVG 环形（外径 80px，线宽 6px）+ 右侧文字
**环形颜色**: 单色 `#2ea87a`，stroke-dasharray 动态计算
**文字**: "本月总预算 ¥4,210 / ¥6,100 · 剩 ¥1,890 · 还剩 16 天"

**SVG 参数**:
```
viewBox="0 0 80 80"
圆心 (40,40), 半径 33
周长 = 2π × 33 ≈ 207.35
dashoffset = 207.35 × (1 - percentage)
```

### 3.4 CategoryRingCard

**布局**: 4 列 grid（桌面），每列一张卡片
**内容** (从上到下):
1. 小环形 SVG（外径 40px，线宽 3px），中间放图标
2. 分类名（12px）
3. 已花金额（12px bold）
4. 提示文字（11px）: "剩 ¥700" 绿色 / "超 ¥30" 红色

**状态**:
| 条件 | 环颜色 | 边框 | 文字 |
|------|--------|------|------|
| spent / limit < 80% | `#2ea87a` 绿 | `#e8f5ee` | "剩 ¥xxx" |
| 80% ≤ spent / limit < 100% | `#f59e0b` 黄 | `#fef3e0` | "剩 ¥xxx" |
| spent / limit ≥ 100% | `#e25c3b` 红 | `#fde1d5` | "超 ¥xxx" + 角标"超支" |

**无预算分类**:
- 灰色环（`#d6cec4`）+ "未设预算" 文字
- 显示已花金额
- 点击 → `router.push('/settings?tab=categories&highlight={id}')`

### 3.5 月度对比

CategoryRingCard 底部额外一行（只在有 lastMonthSpent 数据时显示）:
- 比上月少花 → "↓ ¥200" 绿色
- 比上月多花 → "↑ ¥200" 橙色

---

## 4. 图标主题系统

### 架构

```
┌──────────────────────────────────┐
│  IconProvider (Context)          │
│  - theme: 'lucide'|'emoji'|'colored'  │
│  - setTheme(t) → localStorage    │
├──────────────────────────────────┤
│  useIconTheme() → { theme,       │
│    getIcon(name): JSX.Element }  │
├──────────┬──────────┬────────────┤
│ lucide   │ emoji    │ colored    │
│ 映射表   │ 映射表   │ 映射表     │
└──────────┴──────────┴────────────┘
```

### 文件: `src/lib/icon-themes.ts`

```typescript
export type IconTheme = 'lucide' | 'emoji' | 'colored';

// 每个主题是一张 { iconKey → render function } 的映射表
export const ICON_THEMES: Record<IconTheme, Record<string, () => JSX.Element>> = {
  lucide: { /* Utensils → <Utensils size={16}/> */ },
  emoji:  { /* food → <span>🍜</span> */ },
  colored: { /* food → 色块+白线 Lucide icon */ },
};
```

**iconKey 统一命名**: 使用英文语义 key（`food`, `transport`, `entertainment`, `shopping`, `housing`, `communication`, `medical`, `education`, `gift`, `pet`, `travel`, `beauty`, `digital`, `other`），不和任何具体图标库绑定。新增 `getIconKey(categoryId, categoryName): string` 函数做分类→语义 key 映射。

**Colored 主题颜色分配**: 每个语义 key 对应一个固定色块颜色（如 food→#2ea87a, transport→#f59e0b）。预设 14 个 key 的颜色，未知 key fallback 到灰色 `#6b5d52`。

### 文件: `src/components/IconProvider.tsx`

```typescript
const IconContext = createContext<{
  theme: IconTheme;
  setTheme: (t: IconTheme) => void;
  getIcon: (key: string) => JSX.Element | null;
}>(...);

export function IconProvider({ children }) {
  const [theme, setTheme] = useState<IconTheme>(
    () => (localStorage.getItem('icon-theme') as IconTheme) || 'lucide'
  );
  // setTheme 时同步写 localStorage
  // getIcon(key) → ICON_THEMES[theme][key]?.() || null
}
```

### 设置页切换 UI

设置页新增区域（categories tab 上方）:
```
图标风格:  [Lucide 线性] [Emoji] [色块图标]
```
三个按钮，当前选中高亮。切换后全站图标实时更换。

### 迁移策略

1. `icon-map.tsx` 现有函数（`getCategoryIcon`, `getChannelIcon` 等）改为内部调用 `useIconTheme().getIcon()`
2. 新增 `getIconKeyByCategory(categoryName: string): string` — 分类名→语义 key
3. 旧代码中直接 import Lucide 图标的地方不动（那些是 UI 图标，不是数据图标）

---

## 5. 数据流

### API (现有，微调)

`GET /api/dashboard` 返回新增字段:

```typescript
{
  // ... 现有字段不变 (totalIncome, totalExpense, balance, trend, recent, accounts)
  budgets: {
    id: string;
    name: string;
    icon: string;           // emoji string，保持不变（前端用 icon-theme 覆盖显示）
    budgetLimit: number;
    spent: number;
    lastMonthSpent: number; // 新增：上月同一分类支出（按自然月算：当前 5 月→比较 4 月）
  }[];
  allExpenseCategories: {   // 新增：所有支出分类，供前端找"未设预算"的分类
    id: string;
    name: string;
    icon: string;
    budgetLimit: number | null;
  }[];
}
```

**lastMonthSpent 计算**:
- 上月 = 当前日期减一个月，取该月第一天和最后一天
- `db.transaction.aggregate({ where: { categoryId, type: 'expense', date: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { amount: true } })`
- 上月无数据时返回 0（不返回 null/undefined）

### 前端状态

```
DashboardPage
  ├─ fetch('/api/dashboard') → data.budgets, data.categories?
  ├─ BudgetOverview ← budgets + allCategories
  │   ├─ derived: totalBudget, totalSpent, percentage
  │   ├─ derived: overBudgetList (spent/limit >= 0.8)
  │   └─ localStorage: banner dismissed state
  └─ 其他组件不变
```

### 设置页跳转

```
点击未设预算卡片 → router.push('/settings?tab=categories&highlight=CATEGORY_ID')
SettingsPage → useSearchParams → tab='categories', highlight → scrollIntoView + 高亮动画
```

---

## 6. 颜色系统

沿用现有暖色调，补充语义色:

| 角色 | 色值 | 用途 |
|------|------|------|
| 背景 | `#faf7f2` | 卡片底色 |
| 卡片白 | `#ffffff` | 内层卡片 |
| 主文字 | `#3d342b` | 金额、标题 |
| 辅助文字 | `#6b5d52` | 标签、提示 |
| 绿色(安全) | `#2ea87a` | 预算利用率 <80%、环、边框 |
| 黄色(提醒) | `#f59e0b` | 80-100%、即将超支 |
| 红色(超支) | `#e25c3b` | >100%、角标、横幅 |
| 灰色(未设) | `#d6cec4` | 无预算限制的分类 |
| 图标色块绿 | `#2ea87a` | Colored 主题餐饮背景 |
| 图标色块黄 | `#f59e0b` | Colored 主题交通背景 |
| 图标色块红 | `#e25c3b` | Colored 主题娱乐背景 |
| 图标色块紫 | `#8b5cf6` | Colored 主题购物背景 |

---

## 7. 错误处理

| 场景 | 处理 |
|------|------|
| API 返回失败 | BudgetOverview 不渲染，不影响仪表盘其他区域 |
| budgets 数组为空 | 显示"暂无预算数据，去设置 →"空状态 |
| localStorage 不可用 | try/catch 包裹，fallback 为 lucide 主题、横幅不记录 |
| SVG 环计算异常 | Math.max(0, Math.min(1, percentage)) 夹紧 |

---

## 8. 测试策略

- **组件渲染**: BudgetOverview 在 budgets=[] 时不崩溃
- **环形计算**: spent/limit 0%, 50%, 100%, 150% 分别验证颜色和 dashoffset
- **横幅逻辑**: 当天 dismiss 后不重现，次日重现
- **图标切换**: 三种主题切换后 getIcon() 返回不同 JSX
- **跳转链接**: 未设预算卡片 href 包含正确的 query params

---

## 9. 范围边界（YAGNI）

**本次不做**:
- 预算历史趋势图（ECharts）— 月度对比仅文字
- 预算设置向导 / 引导流程
- 推送通知（企业微信/邮件）
- 动画的 prefers-reduced-motion 适配（已有全局规则）
- 收入预算（仅支出预算）
