# 自定义标题栏设计规格

**日期**: 2026-05-31  
**状态**: 设计确认，待实现

## 目标

去除 Windows 原生窗口标题栏，用 HTML/CSS 自绘标题栏，使窗口外观与 app 暖色调 UI 协调统一。用户可在设置中选择 Windows 风格或 Mac 风格按钮。

## 整体方案

- Electron `frame: false` 隐藏原生标题栏
- 新建 `TitleBar` React 组件绘制标题栏
- 标题栏嵌入 `AppShell` 顶部
- 设置页增加标题栏风格选项
- 首次启动自动检测平台选择默认风格

## 视觉规格

### 共用参数

| 属性 | 值 |
|------|-----|
| 标题栏高度 | 36px |
| 左右内边距 | 14px |
| 背景色 | #faf7f2 |
| 琥珀底线 | 2px solid #f59e0b |
| app 名字号 | 13px |
| app 名颜色 (Windows) | #3d342b, font-weight 600 |
| app 名颜色 (Mac) | #6b5d52, font-weight 500 |
| 琥珀小圆点 | 7×7px, #f59e0b, 距文字 8px |

### Windows 风格按钮

| 按钮 | 尺寸 | 图标 | 描边色 | 描边宽 |
|------|------|------|--------|--------|
| 最小化 | 28×28px | 水平线 ─ | #6b5d52 | 1.2px |
| 最大化 | 28×28px | 方框 □ | #6b5d52 | 1.2px |
| 关闭 | 28×28px | 叉号 ✕ | #c97d60 | 1.3px |

- 按钮圆角: 4px
- 按钮间距: 2px
- 关闭按钮与最大化之间: 6px
- hover 背景: rgba(0,0,0,0.06)
- 关闭按钮 hover: 背景 #e88b6e, 叉号变白

### Mac 风格按钮

| 按钮 | 颜色 | 尺寸 |
|------|------|------|
| 关闭 | #ee6b5b | 11×11px |
| 最小化 | #f0c14b | 11×11px |
| 全屏 | #63c556 | 11×11px |

- 按钮间距: 7px
- 按钮组距文字: 14px
- hover: 颜色加深 15%

### 颜色清单

| 用途 | 色值 |
|------|------|
| 标题栏背景 | #faf7f2 |
| 琥珀底线/圆点 | #f59e0b |
| app 名 Windows | #3d342b |
| app 名 Mac / 按钮描边 | #6b5d52 |
| 关闭按钮描边 | #c97d60 |
| 关闭按钮 hover 底 | #e88b6e |
| Mac 红点 | #ee6b5b |
| Mac 黄点 | #f0c14b |
| Mac 绿点 | #63c556 |

## 交互

- 标题栏可拖拽移动窗口 (`-webkit-app-region: drag`)
- 按钮区域阻止拖拽 (`-webkit-app-region: no-drag`)
- 双击标题栏: 最大化/还原
- 最小化/最大化/关闭: 调用 Electron IPC

## 设置页

在设置 > 外观下增加:

```
标题栏风格: ◎ 跟随系统  ○ Windows 风格  ○ Mac 风格
```

存储键: `titlebar-style`，值: `"auto"` | `"windows"` | `"mac"`

## 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `electron/main.js` | 修改 | `frame: false`, 暴露 `platform` |
| `electron/preload.js` | 修改或新建 | 暴露窗口控制 IPC |
| `src/components/TitleBar.tsx` | **新建** | 自绘标题栏组件 |
| `src/components/AppShell.tsx` | 修改 | 顶部嵌入 TitleBar |
| `src/app/settings/page.tsx` | 修改 | 增加标题栏风格选项 |
| `src/lib/titlebar-store.ts` | **新建** | localStorage 读写风格偏好 |
| `src/app/globals.css` | 修改 | 拖拽区域样式 |

## 不变更

- App 内部 UI（页面、导航、配色、组件）保持不变
- 左侧导航栏保持不变
- 数据库/后端逻辑不变
