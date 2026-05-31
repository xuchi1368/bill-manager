'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppIcon from './AppIcon';

const items = [
  { href: '/dashboard', icon: 'dashboard' as const, label: '仪表盘' },
  { href: '/transactions', icon: 'transactions' as const, label: '记账' },
  { href: '/reports', icon: 'reports' as const, label: '报表' },
  { href: '/recurring', icon: 'recurring' as const, label: '周期' },
  { href: '/help', icon: 'help' as const, label: '帮助' },
  { href: '/settings', icon: 'settings' as const, label: '设置' },
];

export default function MobileTabBar({ currentPath }: { currentPath: string }) {
  const router = useRouter();

  useEffect(() => {
    items.forEach(i => router.prefetch(i.href));
  }, [router]);
  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath.startsWith('/dashboard');
    return currentPath.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#ede6dd] flex justify-around items-center py-1.5 px-2 z-50 safe-area-bottom">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
              active ? 'text-[#f59e0b]' : 'text-[#6b5d52]'
            }`}
          >
            <AppIcon name={item.icon} size={20} strokeWidth={active ? 2 : 1.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
      <button
        onClick={async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.href = '/login';
        }}
        className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer text-[#6b5d52]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span className="text-[10px] font-medium">退出</span>
      </button>
    </nav>
  );
}
