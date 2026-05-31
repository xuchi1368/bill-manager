import type { Metadata } from 'next';
import './globals.css';
import { register } from '@/lib/registry';
import AppShell from '@/components/AppShell';
import { IconProvider } from '@/components/IconProvider';

register();

export const metadata: Metadata = {
  title: '账单管理',
  description: '个人账单管理系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#faf7f2] text-[#3d342b] antialiased">
        <IconProvider>
          <AppShell>{children}</AppShell>
        </IconProvider>
      </body>
    </html>
  );
}
