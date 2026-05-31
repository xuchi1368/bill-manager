'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const SHORTCUT_HINT = 'Ctrl+N 快记 · Enter 确认 · Esc 关闭';

export default function KeyboardShortcuts() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+N: Quick add (from any page)
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        const fab = document.querySelector('[title="快速记账"]') as HTMLElement;
        fab?.click();
      }
      // Esc: close modals
      if (e.key === 'Escape') {
        // close QuickAdd modal if open
        const overlay = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
        if (overlay) overlay.click();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="hidden md:block fixed bottom-3 right-3 text-[10px] text-[#6b5d52] bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md pointer-events-none z-50">
      {SHORTCUT_HINT}
    </div>
  );
}
