'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import LeftRail from './LeftRail';
import MobileTabBar from './MobileTabBar';
import QuickAddPanel from './QuickAddPanel';
import TitleBar from './TitleBar';
import KeyboardShortcuts from './KeyboardShortcuts';
import DraggableFAB from './DraggableFAB';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleCreated = useCallback(() => {
    // Data refresh handled via window 'transaction-created' event
  }, []);

  useEffect(() => {
    const handler = () => setShowQuickAdd(true);
    window.addEventListener('quick-add', handler);
    return () => window.removeEventListener('quick-add', handler);
  }, []);

  if (isHome) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <TitleBar />
        <main className="flex-1 overflow-auto p-4 flex flex-col">
          <div className="max-w-2xl mx-auto flex flex-col flex-1">{children}</div>
        </main>
        <KeyboardShortcuts />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 min-h-0">
        <LeftRail currentPath={pathname} />
        <main className="flex-1 px-5 py-3 pb-16 md:pb-3 overflow-auto flex flex-col">
          {children}
        </main>
        <MobileTabBar currentPath={pathname} />
      </div>

      {/* Draggable FAB */}
      <DraggableFAB onClick={() => setShowQuickAdd(true)} />

      {/* QuickAdd modal */}
      {showQuickAdd && (
        <QuickAddPanel
          onCreated={handleCreated}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
      <KeyboardShortcuts />
    </div>
  );
}
