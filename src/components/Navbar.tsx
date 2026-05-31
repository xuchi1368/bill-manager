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
    <aside className="w-48 min-h-screen bg-white border-r border-[#ede6dd] p-4 flex flex-col gap-0.5">
      <div className="mb-6 px-2 py-1">
        <h1 className="text-lg font-bold text-[#3d342b]">💰 账单管理</h1>
        <p className="text-[11px] text-[#6b5d52] mt-0.5">个人财务助手</p>
      </div>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 transition-colors ${
            pathname === link.href
              ? 'bg-amber-50 text-amber-600 font-medium'
              : 'text-[#6b5d52] hover:text-[#3d342b] hover:bg-[#f5f2ed]'
          }`}
        >
          <span className="text-base">{link.icon}</span>
          <span>{link.label}</span>
        </Link>
      ))}
    </aside>
  );
}
