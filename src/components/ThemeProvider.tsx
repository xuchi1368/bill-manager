'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }>({ theme: 'light', toggle: () => {}, setTheme: () => {} });
export function useTheme() { return useContext(ThemeContext); }

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    const stored = localStorage.getItem('bill-theme') as Theme;
    if (stored === 'dark') { setTheme('dark'); document.documentElement.classList.add('dark'); }
  }, []);
  const toggle = () => setTheme(t => { const n = t === 'light' ? 'dark' : 'light'; localStorage.setItem('bill-theme', n); document.documentElement.classList.toggle('dark', n === 'dark'); return n; });
  const set = (t: Theme) => { setTheme(t); localStorage.setItem('bill-theme', t); document.documentElement.classList.toggle('dark', t === 'dark'); };
  return <ThemeContext.Provider value={{ theme, toggle, setTheme: set }}>{children}</ThemeContext.Provider>;
}
