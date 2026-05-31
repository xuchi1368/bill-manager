'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, PenLine, BarChart3, CalendarDays, Settings } from 'lucide-react';

const items = [
  { href: '/dashboard', Icon: LayoutDashboard, label: '仪表盘' },
  { href: '/transactions', Icon: PenLine, label: '记账' },
  { href: '/reports', Icon: BarChart3, label: '报表' },
  { href: '/recurring', Icon: CalendarDays, label: '周期' },
  { href: '/settings', Icon: Settings, label: '设置' },
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
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer ${
              active ? 'text-[#f59e0b]' : 'text-[#6b5d52]'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2 : 1.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
