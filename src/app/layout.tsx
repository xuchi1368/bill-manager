import type { Metadata } from 'next';
import './globals.css';
import { register } from '@/lib/registry';
import AppShell from '@/components/AppShell';
import { IconProvider } from '@/components/IconProvider';
import { ViewTransitionProvider } from '@/components/ViewTransitionProvider';
import ThemeProvider from '@/components/ThemeProvider';
import ToastProvider from '@/components/ToastProvider';

register();

export const metadata: Metadata = {
  title: '账单管理',
  description: '个人账单管理系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <ThemeProvider>
        <IconProvider>
          <ViewTransitionProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </ViewTransitionProvider>
        </IconProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
