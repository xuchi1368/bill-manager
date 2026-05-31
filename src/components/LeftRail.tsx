'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, PenLine, BarChart3, CalendarDays, Settings, Home } from 'lucide-react';

const items = [
  { href: '/dashboard', Icon: LayoutDashboard, label: '仪表盘', activeBg: 'bg-[#fef3c7]' },
  { href: '/transactions', Icon: PenLine, label: '记账', activeBg: 'bg-[#ffe4e6]' },
  { href: '/reports', Icon: BarChart3, label: '报表', activeBg: 'bg-[#d1fae5]' },
  { href: '/recurring', Icon: CalendarDays, label: '周期账单', activeBg: 'bg-[#dbeafe]' },
];

const allHrefs = ['/', '/settings', ...items.map(i => i.href)];

export default function LeftRail({ currentPath }: { currentPath: string }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tooltipTimer, setTooltipTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Prefetch all pages on mount to eliminate first-click lag
  useEffect(() => {
    allHrefs.forEach(h => router.prefetch(h));
  }, [router]);

  function handleMouseEnter(href: string) {
    setHovered(href);
    const t = setTimeout(() => setTooltip(href), 800);
    setTooltipTimer(t);
  }

  function handleMouseLeave() {
    setHovered(null);
    if (tooltipTimer) clearTimeout(tooltipTimer);
    setTooltip(null);
  }

  const isActive = (href: string) => currentPath.startsWith(href);

  return (
    <nav className="hidden md:flex flex-col items-center w-16 bg-white border-r border-[#ede6dd] py-4 gap-1 flex-shrink-0">
      <Link
        href="/"
        className="p-2 hover:scale-110 transition-transform cursor-pointer"
        title="首页"
      >
        <Home size={22} className="text-[#3d342b]" strokeWidth={1.5} />
      </Link>

      <div className="flex-1 flex flex-col items-center gap-1 pt-3">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.Icon;
          return (
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                onMouseEnter={() => handleMouseEnter(item.href)}
                onMouseLeave={handleMouseLeave}
                className={`p-2.5 rounded-xl block transition-all cursor-pointer ${
                  active
                    ? item.activeBg
                    : hovered === item.href
                      ? 'bg-[#f5f2ed] opacity-70'
                      : 'opacity-35 hover:opacity-70'
                }`}
                title={item.label}
              >
                <Icon size={20} strokeWidth={1.5} />
              </Link>
              {tooltip === item.href && (
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-[#3d342b] text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Link
        href="/settings"
        className={`p-2.5 rounded-xl block transition-all cursor-pointer ${
          isActive('/settings')
            ? 'bg-[#f5f2ed]'
            : hovered === '/settings'
              ? 'bg-[#f5f2ed] opacity-70'
              : 'opacity-35 hover:opacity-70'
        }`}
        onMouseEnter={() => handleMouseEnter('/settings')}
        onMouseLeave={handleMouseLeave}
        title="设置"
      >
        <Settings size={20} strokeWidth={1.5} />
      </Link>
    </nav>
  );
}
