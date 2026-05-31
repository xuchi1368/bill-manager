'use client';

import { useEffect, useState } from 'react';
import { getTitlebarStyle, type TitlebarStyle } from '@/lib/titlebar-store';

// 类型声明 — electronAPI 由 preload.js 注入
declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      onMaximizeChange: (cb: (max: boolean) => void) => () => void;
    };
  }
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
          const lines = e.currentTarget.querySelectorAll('line');
          lines.forEach(l => l.setAttribute('stroke', '#fff'));
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          const lines = e.currentTarget.querySelectorAll('line');
          lines.forEach(l => l.setAttribute('stroke', '#c97d60'));
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
      <button onClick={() => window.electronAPI?.close()} style={macDot('#ee6b5b')} title="关闭" />
      <button onClick={() => window.electronAPI?.minimize()} style={macDot('#f0c14b')} title="最小化" />
      <button onClick={() => window.electronAPI?.maximize()} style={macDot('#63c556')} title="全屏" />
    </div>
  );
}

// ---- 主组件 ----
export default function TitleBar() {
  const [style, setStyle] = useState<TitlebarStyle>('auto');

  useEffect(() => {
    setStyle(getTitlebarStyle());

    // 监听最大化状态 (preload 已修复返回 cleanup)
    const cleanup = window.electronAPI?.onMaximizeChange(() => {
      // 可以用于更新最大化图标
    });

    // 双击标题栏最大化/还原
    const handleDblClick = () => window.electronAPI?.maximize();
    const bar = document.getElementById('custom-titlebar');
    bar?.addEventListener('dblclick', handleDblClick);
    return () => {
      cleanup?.();
      bar?.removeEventListener('dblclick', handleDblClick);
    };
  }, []);

  // 监听 localStorage 变化（设置页切换风格时刷新）
  useEffect(() => {
    const onStorage = () => setStyle(getTitlebarStyle());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* 左侧：Mac 按钮或 Windows 风格 */}
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
