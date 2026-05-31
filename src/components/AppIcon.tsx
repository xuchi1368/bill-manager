'use client';

import React from 'react';
import { useIconTheme } from './IconProvider';
import {
  LayoutDashboard, PenLine, BarChart3, CalendarDays, Settings, Home, BookOpen, LogOut,
  FolderOpen, CreditCard, Download, Filter, Database, Palette, type LucideIcon,
} from 'lucide-react';

export type IconName = 'home' | 'dashboard' | 'transactions' | 'reports' | 'recurring' |
  'settings' | 'help' | 'logout' | 'categories' | 'channels' | 'import' |
  'rules' | 'backup' | 'appearance';

const LUCIDE_MAP: Record<IconName, LucideIcon> = {
  home: Home, dashboard: LayoutDashboard, transactions: PenLine, reports: BarChart3,
  recurring: CalendarDays, settings: Settings, help: BookOpen, logout: LogOut,
  categories: FolderOpen, channels: CreditCard, import: Download, rules: Filter,
  backup: Database, appearance: Palette,
};

const EMOJI_MAP: Record<IconName, string> = {
  home: '🏠', dashboard: '📊', transactions: '✏️', reports: '📈',
  recurring: '🔁', settings: '⚙️', help: '📖', logout: '🚪',
  categories: '📂', channels: '💳', import: '📥', rules: '📏',
  backup: '💾', appearance: '🎨',
};

interface Props {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export default function AppIcon({ name, size = 20, strokeWidth = 1.5 }: Props) {
  const { theme } = useIconTheme();

  if (theme === 'emoji') {
    return <span style={{ fontSize: size * 0.85 }}>{EMOJI_MAP[name]}</span>;
  }

  // lucide or colored — both use Lucide icons (colored just changes stroke/fill style)
  const Icon = LUCIDE_MAP[name];
  if (!Icon) return null;

  if (theme === 'colored') {
    return <Icon size={size} strokeWidth={strokeWidth + 0.5} className="text-[#f59e0b]" />;
  }

  return <Icon size={size} strokeWidth={strokeWidth} />;
}

// Hook for inline text icons (for settings tabs, help headers etc.)
export function useAppEmoji() {
  const { theme } = useIconTheme();
  return (name: IconName): string => {
    return EMOJI_MAP[name] || '';
  };
}
