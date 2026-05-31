# 自定义标题栏 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 隐藏 Windows 原生标题栏，用 HTML/CSS 自绘标题栏，支持 Windows/Mac 两种按钮风格，用户可在设置中选择。

**架构：** Electron `frame: false` 隐藏原生框 → `preload.js` 暴露窗口控制 API → `TitleBar` React 组件绘制标题栏嵌入 `AppShell` → 设置页提供风格切换。首次启动自动检测平台选默认风格。

**技术栈：** Electron 42, Next.js 14, React 18, CSS Modules (globals.css)

**设计文档：** `docs/superpowers/specs/2026-05-31-custom-titlebar-design.md`

---

### 任务 1：Electron 主进程 — 无框窗口 + IPC + preload

**文件：**
- 修改：`electron/main.js`
- 创建：`electron/preload.js`

- [ ] **步骤 1：创建 preload.js，暴露窗口控制 API 和平台信息**

```js
// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,               // 'win32' | 'darwin' | 'linux'
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => {
    ipcRenderer.on('window-maximize-change', (_event, isMaximized) => callback(isMaximized));
  },
});
```

- [ ] **步骤 2：修改 main.js — frame:false + preload + IPC handlers**

```js
// electron/main.js — 替换 createWindow 函数和 app.whenReady

const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let tray;
let serverProcess;

function startNextServer() {
  // ... 保持不变 ...
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '账单管理',
    frame: false,                              // ← 隐藏原生标题栏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),  // ← 加载 preload
    },
  });

  mainWindow.loadURL('http://localhost:8888');

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // 通知渲染进程最大化状态变化
  mainWindow.on('maximize', () => mainWindow.webContents.send('window-maximize-change', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximize-change', false));
}

// IPC handlers — 窗口控制
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

app.whenReady().then(async () => {
  // ... startNextServer 和 createWindow 保持不变 ...
});

// ... 其余代码保持不变 ...
```

- [ ] **步骤 3：验证 — 启动 Electron dev 模式，确认窗口无原生标题栏**

```bash
cd /c/Users/Administrator/bill-manager && npm run electron:dev
```

预期：窗口打开，无 Windows 原生标题栏。由于 TitleBar 组件还没写，顶部留空。确认后关闭窗口。

- [ ] **步骤 4：Commit**

```bash
git add electron/main.js electron/preload.js
git commit -m "feat: add frameless window with IPC and preload for custom titlebar"
```

---

### 任务 2：TitleBar React 组件

**文件：**
- 创建：`src/components/TitleBar.tsx`
- 创建：`src/lib/titlebar-store.ts`
- 修改：`src/app/globals.css`

- [ ] **步骤 1：创建 titlebar 偏好存储模块**

```ts
// src/lib/titlebar-store.ts
const STORAGE_KEY = 'titlebar-style';

export type TitlebarStyle = 'auto' | 'windows' | 'mac';

export function getTitlebarStyle(): TitlebarStyle {
  if (typeof window === 'undefined') return 'auto';
  return (localStorage.getItem(STORAGE_KEY) as TitlebarStyle) || 'auto';
}

export function setTitlebarStyle(style: TitlebarStyle): void {
  localStorage.setItem(STORAGE_KEY, style);
}
```

- [ ] **步骤 2：创建 TitleBar 组件**

```tsx
// src/components/TitleBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { getTitlebarStyle, setTitlebarStyle, type TitlebarStyle } from '@/lib/titlebar-store';

// 类型声明 — electronAPI 由 preload.js 注入
declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      onMaximizeChange: (cb: (max: boolean) => void) => void;
    };
  }
}

// ---- Windows 风格按钮 ----
function WinButtons() {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {/* 最小化 */}
      <button
        onClick={() => window.electronAPI?.minimize()}
        style={winBtnBase}
        title="最小化"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="1" y1="5" x2="9" y2="5" stroke="#6b5d52" strokeWidth="1.2" />
        </svg>
      </button>
      {/* 最大化 */}
      <button
        onClick={() => window.electronAPI?.maximize()}
        style={winBtnBase}
        title="最大化"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="#6b5d52" strokeWidth="1.2" />
        </svg>
      </button>
      {/* 关闭 */}
      <button
        onClick={() => window.electronAPI?.close()}
        style={{ ...winBtnBase, marginLeft: 6 }}
        title="关闭"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#e88b6e';
          e.currentTarget.querySelector('line')?.setAttribute('stroke', '#fff');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.querySelector('line')?.setAttribute('stroke', '#c97d60');
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="2" y1="2" x2="8" y2="8" stroke="#c97d60" strokeWidth="1.3" />
          <line x1="8" y1="2" x2="2" y2="8" stroke="#c97d60" strokeWidth="1.3" />
        </svg>
      </button>
    </div>
  );
}

// ---- Mac 风格按钮 ----
function MacButtons() {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginRight: 14 }}>
      {/* 关闭 */}
      <button
        onClick={() => window.electronAPI?.close()}
        style={macDot('#ee6b5b')}
        title="关闭"
      />
      {/* 最小化 */}
      <button
        onClick={() => window.electronAPI?.minimize()}
        style={macDot('#f0c14b')}
        title="最小化"
      />
      {/* 全屏 */}
      <button
        onClick={() => window.electronAPI?.maximize()}
        style={macDot('#63c556')}
        title="全屏"
      />
    </div>
  );
}

// ---- 主组件 ----
export default function TitleBar() {
  const [style, setStyle] = useState<TitlebarStyle>('auto');
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    setStyle(getTitlebarStyle());

    // 监听最大化状态
    window.electronAPI?.onMaximizeChange(setIsMaximized);

    // 双击标题栏最大化/还原
    const handleDblClick = () => window.electronAPI?.maximize();
    const bar = document.getElementById('custom-titlebar');
    bar?.addEventListener('dblclick', handleDblClick);
    return () => bar?.removeEventListener('dblclick', handleDblClick);
  }, []);

  // 非 Electron 环境不渲染
  if (typeof window === 'undefined' || !window.electronAPI) return null;

  // 计算生效风格
  const effectiveStyle: 'windows' | 'mac' =
    style === 'auto'
      ? window.electronAPI.platform === 'darwin' ? 'mac' : 'windows'
      : style;

  return (
    <div
      id="custom-titlebar"
      style={{
        height: 36,
        background: '#faf7f2',
        borderBottom: '2px solid #f59e0b',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        WebkitAppRegion: 'drag',      // 拖拽移动窗口
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* 左侧：Mac 按钮或平台占位 */}
      {effectiveStyle === 'mac' ? (
        <MacButtons />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, background: '#f59e0b', borderRadius: '50%', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#3d342b' }}>账单管理</span>
        </div>
      )}

      {/* Mac 风格：app 名跟在按钮右边 */}
      {effectiveStyle === 'mac' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, background: '#f59e0b', borderRadius: '50%', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#6b5d52' }}>账单管理</span>
        </div>
      )}

      {/* 右侧：Windows 按钮 */}
      {effectiveStyle === 'windows' && (
        <div style={{ marginLeft: 'auto', WebkitAppRegion: 'no-drag' }}>
          <WinButtons />
        </div>
      )}
    </div>
  );
}

// ---- 样式常量 ----
const winBtnBase: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  WebkitAppRegion: 'no-drag',
};

function macDot(color: string): React.CSSProperties {
  return {
    width: 11,
    height: 11,
    borderRadius: '50%',
    background: color,
    border: 'none',
    cursor: 'pointer',
    WebkitAppRegion: 'no-drag',
  };
}
```

- [ ] **步骤 3：globals.css 增加拖拽区域样式**

```css
/* src/app/globals.css — 在 @layer base 的 body 块之后添加 */

/* 标题栏拖拽区域 */
#custom-titlebar {
  -webkit-app-region: drag;
}
#custom-titlebar button {
  -webkit-app-region: no-drag;
}
```

- [ ] **步骤 4：验证 — dev 模式确认 TitleBar 显示正确**

```bash
cd /c/Users/Administrator/bill-manager && npm run electron:dev
```

预期：顶部显示 36px 暖色标题栏，app 名 + 琥珀圆点 + 窗口按钮。按钮可点击（最小化/最大化/关闭）。标题栏可拖拽移动窗口。

- [ ] **步骤 5：Commit**

```bash
git add src/components/TitleBar.tsx src/lib/titlebar-store.ts src/app/globals.css
git commit -m "feat: add custom TitleBar component with Windows and Mac styles"
```

---

### 任务 3：嵌入 AppShell + 非 Electron 兼容

**文件：**
- 修改：`src/components/AppShell.tsx`

- [ ] **步骤 1：在 AppShell 顶部嵌入 TitleBar**

```tsx
// src/components/AppShell.tsx — 在 return 的最外层 div 之前插入 TitleBar

import TitleBar from './TitleBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  // ... 现有代码保持不变 ...

  if (isHome) {
    return (
      <>
        <TitleBar />
        <main className="min-h-screen p-6">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">   {/* ← 改为 column 布局 */}
      <TitleBar />
      <div className="flex flex-1 min-h-0">        {/* ← 原 flex row 包裹在这里 */}
        <LeftRail currentPath={pathname} />
        <main className="flex-1 px-5 py-3 pb-20 md:pb-3 overflow-auto">
          {children}
        </main>
        <MobileTabBar currentPath={pathname} />
      </div>

      {/* FAB 和 QuickAdd 保持不变 */}
      {/* ... */}
    </div>
  );
}
```

- [ ] **步骤 2：验证 — 浏览器 dev 模式 + Electron dev 模式都测试**

```bash
# 1. 浏览器 dev（不应显示 TitleBar）
npx next dev -p 8889
# 在浏览器打开 http://localhost:8889，确认无标题栏，和之前一样

# 2. Electron dev（应显示 TitleBar）
npm run electron:dev
# 确认标题栏显示，按钮可用，拖拽可用
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/AppShell.tsx
git commit -m "feat: embed TitleBar into AppShell, conditional on Electron env"
```

---

### 任务 4：设置页 — 标题栏风格选项

**文件：**
- 修改：`src/app/settings/page.tsx`

- [ ] **步骤 1：在设置页添加"外观"tab 和标题栏风格选择器**

在 tab 列表中增加 `appearance`，在 tab 内容区增加外观设置块：

```tsx
// 在 useState tab 行之后，tab 类型中加入 'appearance'
const [tab, setTab] = useState<... | 'appearance'>(initialTab);

// 新增 state
const [titlebarStyle, setTitlebarStyleState] = useState<TitlebarStyle>('auto');

useEffect(() => {
  setTitlebarStyleState(getTitlebarStyle());
}, []);

function handleTitlebarChange(s: TitlebarStyle) {
  setTitlebarStyleState(s);
  setTitlebarStyle(s);
}

// 在 tabs 按钮行增加
{tabBtn('appearance', '🎨 外观')}

// 在 tab 内容区增加（放在最后一个 tab 之前或作为独立区块）
{tab === 'appearance' && (
  <div>
    <div className="card p-4 mb-4">
      <h3 className="text-sm font-semibold text-[#3d342b] mb-3">🪟 标题栏风格</h3>
      <p className="text-xs text-[#6b5d52] mb-3">
        仅 Electron 桌面版生效。切换后立即应用。
      </p>
      {(['auto', 'windows', 'mac'] as const).map(s => (
        <button
          key={s}
          onClick={() => handleTitlebarChange(s)}
          className={`px-4 py-2 mr-2 rounded-[10px] text-sm font-medium transition-all cursor-pointer ${
            titlebarStyle === s
              ? 'bg-[#f59e0b] text-white shadow-sm'
              : 'bg-[#f5f2ed] text-[#6b5d52] hover:bg-[#ede6dd]'
          }`}
        >
          {s === 'auto' ? '💻 跟随系统' : s === 'windows' ? '🪟 Windows 风格' : '🍎 Mac 风格'}
        </button>
      ))}
      {/* 实时预览 */}
      <div className="mt-4 p-3 bg-[#faf7f2] rounded-xl border border-[#ede6dd]">
        <p className="text-xs text-[#6b5d52] mb-2">预览效果：</p>
        <div style={{
          height: 36, background: '#faf7f2',
          borderBottom: '2px solid #f59e0b',
          display: 'flex', alignItems: 'center',
          padding: '0 14px', borderRadius: '6px 6px 0 0',
        }}>
          {titlebarStyle === 'mac' ? (
            <>
              <div style={{ display: 'flex', gap: 5, marginRight: 12 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ee6b5b' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f0c14b' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#63c556' }} />
              </div>
              <span style={{ fontSize: 11, color: '#6b5d52' }}>账单管理</span>
            </>
          ) : (
            <>
              <div style={{ width: 5, height: 5, background: '#f59e0b', borderRadius: '50%', marginRight: 6 }} />
              <span style={{ fontSize: 11, color: '#3d342b', fontWeight: 600, flex: 1 }}>账单管理</span>
              <div style={{ display: 'flex', gap: 1 }}>
                <svg width="8" height="8"><line x1="1" y1="4" x2="7" y2="4" stroke="#6b5d52" strokeWidth="1"/></svg>
                <svg width="8" height="8"><rect x="1" y="1" width="6" height="6" fill="none" stroke="#6b5d52" strokeWidth="1"/></svg>
                <svg width="8" height="8"><line x1="1.5" y1="1.5" x2="6.5" y2="6.5" stroke="#c97d60" strokeWidth="1"/><line x1="6.5" y1="1.5" x2="1.5" y2="6.5" stroke="#c97d60" strokeWidth="1"/></svg>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    <div className="card p-4">
      <h3 className="text-sm font-semibold text-[#3d342b] mb-3">😀 图标风格</h3>
      {(['lucide', 'emoji', 'colored'] as const).map(t => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`px-3 py-1.5 mr-2 text-xs rounded-[8px] font-medium transition-all cursor-pointer ${
            theme === t
              ? 'bg-[#f59e0b] text-white shadow-sm'
              : 'bg-[#f5f2ed] text-[#6b5d52] hover:bg-[#ede6dd]'
          }`}
        >
          {t === 'lucide' ? '🔲 Lucide 线性' : t === 'emoji' ? '😀 Emoji' : '🎨 色块图标'}
        </button>
      ))}
    </div>
  </div>
)}
```

注意：将原 `categories` tab 中开头的图标风格选择器（`theme` 切换部分）移到新的 `appearance` tab 中，从 `categories` tab 区块删除。

- [ ] **步骤 2：验证**

```bash
# Electron dev 模式
npm run electron:dev
# 进入设置 → 外观，切换标题栏风格，确认标题栏按钮立即变化
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add titlebar style selector in settings appearance tab"
```

---

### 任务 5：端到端验证 + 回归测试

**文件：**
- 无需修改代码

- [ ] **步骤 1：运行现有测试确保无回归**

```bash
cd /c/Users/Administrator/bill-manager && npm test
```

预期：24 tests passed，无新增失败。

- [ ] **步骤 2：生产构建测试**

```bash
npm run build
```

预期：Next.js 构建成功，无 TypeScript 错误。

- [ ] **步骤 3：Electron 打包测试**

```bash
ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" \
ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/" \
CSC_IDENTITY_AUTO_DISCOVERY=false \
npx electron-builder --win --dir
```

预期：打包成功，生成 `dist-electron/win-unpacked/`。

- [ ] **步骤 4：启动打包后的应用验证**

```bash
/c/Users/Administrator/bill-manager/dist-electron/win-unpacked/账单管理.exe &
sleep 8
curl -s http://localhost:8888/api/health
```

预期：
- 窗口无 Windows 原生标题栏
- 顶部显示自绘标题栏（Windows 风格因为系统是 Windows）
- 标题栏可拖拽移动窗口
- 最小化/最大化/关闭按钮功能正常
- 进入设置可切换 Mac 风格，立即生效
- `/api/health` 返回 `{"status":"ok","db":"connected"}`

- [ ] **步骤 5：先还原 libsql 实验改动，再 commit**

当前工作区有未提交的 libsql 实验改动（`src/lib/db.ts`, `package.json`, `package-lock.json`），这些改动是死胡同（libsql 同样有原生模块）。需要还原：

```bash
git checkout -- src/lib/db.ts package.json package-lock.json
```

确认还原后，commit 标题栏相关改动：

```bash
git add -A
git commit -m "feat: complete custom titlebar implementation with platform auto-detect"
```
