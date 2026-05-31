// src/lib/titlebar-store.ts
const STORAGE_KEY = 'titlebar-style';

export type TitlebarStyle = 'auto' | 'windows' | 'mac';

export function getTitlebarStyle(): TitlebarStyle {
  if (typeof window === 'undefined') return 'auto';
  return (localStorage.getItem(STORAGE_KEY) as TitlebarStyle) || 'auto';
}

export function setTitlebarStyle(style: TitlebarStyle): void {
  localStorage.setItem(STORAGE_KEY, style);
}
