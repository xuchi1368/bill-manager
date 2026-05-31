'use client';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

/** 加载骨架 */
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl animate-shimmer" />
      ))}
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
