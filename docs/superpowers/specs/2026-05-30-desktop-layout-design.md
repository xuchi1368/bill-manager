# 桌面端横版布局设计（非对称方案）

**日期**: 2026-05-30
**状态**: 已实现（2026-05-31 验证通过）
**版本**: v2 — 从"宽版居中"升级为"非对称左轨"

## 方案演进

初始采纳宽版居中方案（max-w-6xl + 双栏），但 1920px 屏幕仍有大量留白。用户指出这不是"有意留白"而是"没做完"。升级为非对称布局：

- **左轨导航**：64px 宽度，始终可见，图标导航
- **内容区**：flex:1 自适应填满剩余宽度
- **首页独立**：Hub 页面不显示左轨，保持全屏沉浸

## 架构

```
RootLayout (usePathname 判断)
├─ pathname === '/'  → 居中全屏 Hub（现有行为 + 实时数据卡片）
└─ pathname !== '/'  → flex row: LeftRail(64px) + 内容区(flex:1)
                         ├─ Mobile: LeftRail 隐藏，底部 MobileTabBar 显示
                         └─ Desktop: LeftRail 显示，MobileTabBar 隐藏
```

## LeftRail 组件规格

| 属性 | 值 |
|------|-----|
| 宽度 | 64px |
| 背景 | white + 右侧 1px border #ede6dd |
| 导航项 | 顶部 Logo(💰→首页)，中段 4 功能图标，底部设置(⚙️) |
| 活跃态 | 背景色高亮：📊#fef3c7, 📝#ffe4e6, 📈#d1fae5, 📅#dbeafe |
| 非活跃态 | opacity: 0.35 |
| 悬停态 | 背景 #f5f2ed, opacity → 0.7 |
| Tooltip | hover 1s 后右侧弹出功能名称 |

## MobileTabBar 组件

- `< 768px` 时显示，替代 LeftRail
- 底部固定，5 个图标+文字标签横排
- 当前页文字颜色 #f59e0b，其余 #9c8b7e

## TopBar 移除

- LeftRail 已提供导航和当前位置标识
- 内页标题从 TopBar 移到页面内容区顶部（h2）
- 5 个内页均移除 TopBar 引入

## 首页 Hub（保留）

- 2×2 卡片居中，实时摘要数据（结余/今日笔数/月支出/周期数）
- 走入画面动画保留（Hub → 内页）
- 无左轨，全屏沉浸
- 标题区显示当前月份

## 内页布局

- 容器无 max-w 限制，flex:1 填满左轨右侧剩余空间
- padding: p-6 或 p-8
- 仪表盘/记账页保持双栏布局（lg:grid-cols-2），无 max-w 约束下自然更宽
- 报表页饼图双栏，趋势图独占整行

## 响应式

- `≥ 768px`：LeftRail 显示 + 内容 flex:1
- `< 768px`：LeftRail 隐藏，底部 MobileTabBar，内容区全宽单列
- 首页所有尺寸均无导航条

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/LeftRail.tsx` | 新建 | 64px 桌面导航 |
| `src/components/MobileTabBar.tsx` | 新建 | 底部 TabBar |
| `src/app/layout.tsx` | 修改 | 条件渲染：首页/内页不同布局 |
| `src/components/TopBar.tsx` | 删除 | 不再需要 |
| `src/app/dashboard/page.tsx` | 修改 | 移除 TopBar，标题内嵌 |
| `src/app/transactions/page.tsx` | 修改 | 同上 |
| `src/app/reports/page.tsx` | 修改 | 同上 |
| `src/app/recurring/page.tsx` | 修改 | 同上 |
| `src/app/settings/page.tsx` | 修改 | 同上 |
| `src/app/page.tsx` | 不变 | Hub 页面已含实时数据 |

## 不变的部分

- 首页走入画面动画
- CountUp、stagger、shimmer 动画
- 暖色调主题
- 所有 API 路由
- PageTransition（内页仍可用作挂载动画）
