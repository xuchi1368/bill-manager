'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import LeftRail from './LeftRail';
import MobileTabBar from './MobileTabBar';
import QuickAddPanel from './QuickAddPanel';
import TitleBar from './TitleBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleCreated = useCallback(() => {
    // Data refresh handled via window 'transaction-created' event
  }, []);

  if (isHome) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <TitleBar />
        <main className="flex-1 overflow-auto p-4 flex flex-col">
          <div className="max-w-2xl mx-auto flex flex-col flex-1">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 min-h-0">
        <LeftRail currentPath={pathname} />
        <main className="flex-1 px-5 py-3 pb-16 md:pb-3 overflow-auto">
          {children}
        </main>
        <MobileTabBar currentPath={pathname} />
      </div>

      {/* Global FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#f59e0b] hover:bg-amber-500 active:scale-95 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center cursor-pointer"
        title="快速记账"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* QuickAdd modal */}
      {showQuickAdd && (
        <QuickAddPanel
          onCreated={handleCreated}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
  );
}
