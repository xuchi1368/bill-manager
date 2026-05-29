import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: '账单管理',
  description: '个人账单管理系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-zinc-900 text-white flex">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
