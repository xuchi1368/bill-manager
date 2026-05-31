'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }>({ theme: 'light', toggle: () => {}, setTheme: () => {} });
export function useTheme() { return useContext(ThemeContext); }

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    const stored = localStorage.getItem('bill-theme') as Theme;
    if (stored === 'dark') { setTheme('dark'); }
  }, []);
  useEffect(() => {
    localStorage.setItem('bill-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), []);
  const set = useCallback((t: Theme) => setTheme(t), []);
  return <ThemeContext.Provider value={{ theme, toggle, setTheme: set }}>{children}</ThemeContext.Provider>;
}
