'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: '仪表盘', icon: '📊' },
  { href: '/transactions', label: '记账', icon: '📝' },
  { href: '/reports', label: '报表', icon: '📈' },
  { href: '/recurring', label: '周期账单', icon: '📅' },
  { href: '/settings', label: '设置', icon: '⚙️' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 min-h-screen bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col gap-1">
      <h1 className="text-lg font-bold text-white mb-4">💰 账单管理</h1>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
            pathname === link.href
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <span>{link.icon}</span>
          <span>{link.label}</span>
        </Link>
      ))}
    </aside>
  );
}
