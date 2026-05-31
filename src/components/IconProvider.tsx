'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IconTheme, renderIcon } from '@/lib/icon-themes';

export interface IconContextValue {
  theme: IconTheme;
  setTheme: (t: IconTheme) => void;
  getIcon: (key: string, size?: number) => React.ReactElement | null;
}

const IconContext = createContext<IconContextValue>({
  theme: 'lucide',
  setTheme: () => {},
  getIcon: () => null,
});

export function useIconTheme() {
  return useContext(IconContext);
}

export function IconProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<IconTheme>('lucide');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('icon-theme') as IconTheme | null;
      if (stored === 'lucide' || stored === 'emoji' || stored === 'colored') {
        setThemeState(stored);
      }
    } catch {
      // localStorage 不可用时保持默认 lucide
    }
  }, []);

  const setTheme = useCallback((t: IconTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem('icon-theme', t);
    } catch {
      // ignore
    }
  }, []);

  const getIcon = useCallback((key: string, size?: number) => {
    return renderIcon(theme, key, size);
  }, [theme]);

  return (
    <IconContext.Provider value={{ theme, setTheme, getIcon }}>
      {children}
    </IconContext.Provider>
  );
}
