'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }

const ToastContext = createContext<{ toast: (msg: string, type?: Toast['type']) => void }>({ toast: () => {} });

export function useToast() { return useContext(ToastContext); }

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-[#2ea87a]',
    error: 'bg-rose-50 border-rose-200 text-[#e25c3b]',
    info: 'bg-amber-50 border-amber-200 text-[#92400e]',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`${colors[t.type]} border px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-slide-up pointer-events-auto`}
          >{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
