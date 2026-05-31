'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ThemeName = 'warm' | 'dark' | 'mint' | 'bento' | 'bold';

interface ThemeColors {
  bg: string; card: string; border: string; text: string; muted: string; input: string; accent: string;
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  warm: {
    bg: '#faf7f2', card: '#ffffff', border: '#ede6dd', text: '#3d342b', muted: '#6b5d52', input: '#f5f2ed', accent: '#f59e0b',
  },
  dark: {
    bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', input: '#1e293b', accent: '#f59e0b',
  },
  mint: {
    bg: '#f0fdf4', card: '#ffffff', border: '#bbf7d0', text: '#14532d', muted: '#166534', input: '#dcfce7', accent: '#22c55e',
  },
  bento: {
    bg: '#f5f5f7', card: '#ffffff', border: '#e5e5ea', text: '#1d1d1f', muted: '#86868b', input: '#e8e8ed', accent: '#0071e3',
  },
  bold: {
    bg: '#fffbeb', card: '#ffffff', border: '#000000', text: '#1a1a1a', muted: '#555555', input: '#fef3c7', accent: '#ff5252',
  },
};

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'warm', setTheme: () => {}, colors: THEMES.warm,
});

export function useAppTheme() { return useContext(ThemeContext); }

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('warm');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bill-app-theme') as ThemeName;
      if (stored && THEMES[stored]) setThemeState(stored);
    } catch {}
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    try { localStorage.setItem('bill-app-theme', t); } catch {}
  }, []);

  const colors = THEMES[theme];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-bg', colors.bg);
    root.style.setProperty('--app-card', colors.card);
    root.style.setProperty('--app-border', colors.border);
    root.style.setProperty('--app-text', colors.text);
    root.style.setProperty('--app-muted', colors.muted);
    root.style.setProperty('--app-input', colors.input);
    root.style.setProperty('--app-accent', colors.accent);
  }, [colors]);

  return <ThemeContext.Provider value={{ theme, setTheme, colors }}>{children}</ThemeContext.Provider>;
}
