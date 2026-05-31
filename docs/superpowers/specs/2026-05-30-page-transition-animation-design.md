# 页面切换动画设计：走入画面

**日期**: 2026-05-30
**状态**: 已实现

## 背景

替换原有 PageTransition 的简单 fade+scale 过渡，探索更自然的翻页质感动画。

## 方案探索

### 放弃方案：CSS 3D 翻书

尝试了 5 版分段 3D 翻转原型（flip-v1 到 flip-v5），核心问题是：
- 分段渲染导致亚像素舍入产生可见缝隙
- 段数增加 = 缝隙增多，无法根除
- 无段方案（整页 rotateY + 渐变遮罩）在 React 组件边界下同样遇到渲染限制

结论：纯 CSS 3D 翻书效果在跨组件导航场景下不可行。

### 采纳方案：走入画面（Zoom-Enter）

两步动画衔接：
1. **首页退出**：点击卡片 → 选中卡片放大 scale(1.8) + 其余卡片缩小 scale(0.75) + 标题淡出（400ms ease-out）
2. **内页到达**：新页面从 scale(1.12) + opacity:0 过渡到 scale(1) + opacity:1（500ms ease-out）

## 实现

### 首页 (`src/app/page.tsx`)

- `zooming` state 跟踪当前选中的卡片 href
- 点击后 400ms 延迟执行 `router.push()`
- CSS 类名控制：
  - `active`：`scale-[1.8] opacity-0 z-10`
  - `dimmed`：`opacity-0 scale-75`
  - 标题：`opacity-0 scale-90`
  - 设置链接：`opacity-0`

### 内页到达 (`src/components/PageTransition.tsx`)

- `requestAnimationFrame` 在挂载后触发 `visible` state
- 初始：`opacity: 0, transform: scale(1.12)`
- 到达：`opacity: 1, transform: scale(1)`
- `transition-all duration-500 ease-out`

### 其他动画

所有内页复用以下动画系统：
- **CountUp**：数字滚动（cubic ease-out, 800ms）
- **StatCard**：`animate-slide-up` + CountUp
- **TransactionList**：逐行错开 `animate-slide-up`（每行 +0.04s delay）
- **TopBar**：返回箭头 + 标题 + 底部边框

## 技术要点

- 使用 CSS transition 而非 animation，方便 React 状态驱动
- `requestAnimationFrame` 确保初始样式已渲染后再触发过渡
- 首页卡片在 `zooming` 状态时 `pointer-events: none`（通过 `disabled` 属性）
- 所有动画时长 ≤ 500ms，避免用户等待感
