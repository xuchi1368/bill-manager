'use client';
import { AlertTriangle, Inbox, RefreshCw, Loader2 } from 'lucide-react';

/** 加载骨架 — 模拟页面内容布局 */
export function LoadingSkeleton({ rows = 3, title }: { rows?: number; title?: string }) {
  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <Loader2 size={18} strokeWidth={2} className="text-[#f59e0b] animate-spin" />
          <span className="text-sm text-[#6b5d52]">{title}</span>
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="h-3 rounded-full animate-shimmer" style={{ width: `${30 + Math.random() * 40}%` }} />
          <div className="h-8 rounded-lg animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          <div className="h-4 rounded-full animate-shimmer w-3/4" style={{ animationDelay: `${i * 0.15}s` }} />
        </div>
      ))}
    </div>
  );
}

/** 全局加载覆盖层 — 首次登录或页面跳转时使用 */
export function PageLoader({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/60 flex items-center justify-center animate-pulse">
          <span className="text-2xl">💰</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#f59e0b] flex items-center justify-center">
          <Loader2 size={14} strokeWidth={2.5} className="text-white animate-spin" />
        </div>
      </div>
      <p className="text-sm text-[#6b5d52] animate-pulse">{message}</p>
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-bounce" style={{ animationDelay: '0.15s' }} />
        <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-bounce" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  );
}

/** 错误状态 */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle size={40} strokeWidth={1.5} className="text-[#e25c3b] mb-3" />
      <p className="text-sm text-[#3d342b] font-medium mb-1">加载失败</p>
      <p className="text-xs text-[#6b5d52] mb-4">{message || '请检查网络后重试'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f2ed] hover:bg-[#ede6dd] text-sm text-[#3d342b] rounded-[10px] font-medium transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> 重试
        </button>
      )}
    </div>
  );
}

/** 空状态 */
export function EmptyState({ icon, title, desc, action }: {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3 opacity-40">{icon || <Inbox size={40} strokeWidth={1.5} />}</div>
      <p className="text-sm text-[#3d342b] font-medium mb-1">{title}</p>
      {desc && <p className="text-xs text-[#6b5d52] mb-4">{desc}</p>}
      {action}
    </div>
  );
}
