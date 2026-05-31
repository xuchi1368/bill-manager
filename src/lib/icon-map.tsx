// src/lib/icon-map.tsx
'use client';
import React from 'react';
import { useIconTheme } from '@/components/IconProvider';
import { getIconKey } from '@/lib/icon-themes';
import {
  Package, CreditCard, MessageCircle, CircleDollarSign, Banknote, Building2,
  type LucideIcon
} from 'lucide-react';

const CHANNEL_ICON_MAP: Record<string, LucideIcon> = {
  '微信': MessageCircle, '支付宝': CircleDollarSign,
  '银行卡': CreditCard, '现金': Banknote, '工资卡': Building2,
};

// 分类图标 hook — 返回 (emoji, categoryName) → ReactElement（直接嵌入 JSX）
export function useCategoryIcon() {
  const { getIcon } = useIconTheme();
  return (emoji: string, categoryName?: string): React.ReactElement => {
    const key = getIconKey(categoryName || '', emoji);
    return getIcon(key, 20) || React.createElement(Package, { size: 20 });
  };
}

// 渠道图标 hook — 返回 LucideIcon 组件（不随主题变化）
export function useChannelIcon() {
  return (name: string): LucideIcon => CHANNEL_ICON_MAP[name] || CreditCard;
}

// 保留旧函数签名给非 React 代码（如 API 路由）
export function getChannelIcon(name: string): LucideIcon {
  return CHANNEL_ICON_MAP[name] || CreditCard;
}

export { CHANNEL_ICON_MAP };
