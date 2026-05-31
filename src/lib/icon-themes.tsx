import {
  UtensilsCrossed, Car, ShoppingCart, Home, Gamepad2, Pill, Smartphone,
  Gift, Plane, GraduationCap, Briefcase, Wrench, Package, Heart,
  Flame, Coffee, Sandwich, Pizza, CupSoda, Bus, Fuel, Shirt, Sparkles,
  Film, Music, Laptop, Lightbulb, Droplets, BookOpen, Cat, CreditCard,
  Brush, Cake, Dumbbell, Scissors, Building2, Banknote, Landmark,
  MessageCircle, CircleDollarSign, Bitcoin, type LucideIcon
} from 'lucide-react';
import React from 'react';

export type IconTheme = 'lucide' | 'emoji' | 'colored';

// ============== Lucide 主题 ==============
const LUCIDE_MAP: Record<string, LucideIcon> = {
  food:          UtensilsCrossed,
  transport:     Car,
  shopping:      ShoppingCart,
  housing:       Home,
  entertainment: Gamepad2,
  medical:       Pill,
  communication: Smartphone,
  gift:          Gift,
  travel:        Plane,
  education:     GraduationCap,
  income:        CircleDollarSign,
  investment:    Landmark,
  digital:       Laptop,
  beauty:        Sparkles,
  pet:           Cat,
  other:         Package,
};

// ============== Emoji 主题 ==============
const EMOJI_MAP: Record<string, string> = {
  food: '🍜', transport: '🚗', shopping: '🛒', housing: '🏠',
  entertainment: '🎮', medical: '💊', communication: '📱',
  gift: '🎁', travel: '✈️', education: '🎓', income: '💰',
  investment: '📈', digital: '💻', beauty: '💄', pet: '🐱', other: '📦',
};

// ============== Colored 主题（色块 + Lucide 白线图标）==============
const COLORED_COLORS: Record<string, string> = {
  food: '#2ea87a', transport: '#f59e0b', shopping: '#8b5cf6',
  housing: '#6366f1', entertainment: '#e25c3b', medical: '#ec4899',
  communication: '#06b6d4', gift: '#f43f5e', travel: '#14b8a6',
  education: '#3b82f6', income: '#2ea87a', investment: '#a855f7',
  digital: '#0ea5e9', beauty: '#d946ef', pet: '#f97316', other: '#6b5d52',
};

// ============== 分类 emoji → 语义 key 映射 ==============
const CATEGORY_EMOJI_TO_KEY: Record<string, string> = {
  '🍜': 'food', '🍔': 'food', '🍕': 'food', '🥤': 'food', '☕': 'food',
  '🚗': 'transport', '🚌': 'transport', '⛽': 'transport',
  '🛒': 'shopping', '👗': 'shopping', '💄': 'beauty',
  '🎮': 'entertainment', '🎬': 'entertainment', '🎵': 'entertainment',
  '📱': 'digital', '💻': 'digital',
  '🏠': 'housing', '💡': 'housing', '💧': 'housing',
  '📚': 'education', '💊': 'medical', '🐱': 'pet',
  '🎁': 'gift', '✈️': 'travel', '🏥': 'medical', '🎓': 'education',
  '💰': 'income', '📈': 'investment', '💼': 'income', '🏦': 'income',
  '🧾': 'other', '💳': 'other', '🧹': 'other',
  '🎂': 'food', '⚽': 'entertainment', '🏋️': 'entertainment',
  '🧘': 'entertainment', '💇': 'beauty',
  '🔧': 'other', '📦': 'other', '❤️': 'gift', '🌟': 'other', '🔥': 'other',
};

// 分类名 → 语义 key（当分类没有 emoji 时，按名称匹配）
const CATEGORY_NAME_TO_KEY: Record<string, string> = {
  '餐饮': 'food', '交通': 'transport', '购物': 'shopping', '住房': 'housing',
  '娱乐': 'entertainment', '医疗': 'medical', '通讯': 'communication',
  '礼物': 'gift', '旅行': 'travel', '教育': 'education', '工资': 'income',
  '投资收益': 'investment', '数码': 'digital', '美容': 'beauty', '宠物': 'pet',
  '其他收入': 'income', '转账': 'other',
};

export function getIconKey(categoryName: string, categoryIcon?: string): string {
  if (categoryIcon && CATEGORY_EMOJI_TO_KEY[categoryIcon]) {
    return CATEGORY_EMOJI_TO_KEY[categoryIcon];
  }
  if (CATEGORY_NAME_TO_KEY[categoryName]) {
    return CATEGORY_NAME_TO_KEY[categoryName];
  }
  return 'other';
}

export function renderIcon(theme: IconTheme, key: string, size: number = 16): React.ReactElement {
  switch (theme) {
    case 'lucide': {
      const Icon = LUCIDE_MAP[key] || LUCIDE_MAP['other'];
      return <Icon size={size} strokeWidth={2} />;
    }
    case 'emoji': {
      const emoji = EMOJI_MAP[key] || EMOJI_MAP['other'];
      return <span style={{ fontSize: size }}>{emoji}</span>;
    }
    case 'colored': {
      const Icon = LUCIDE_MAP[key] || LUCIDE_MAP['other'];
      const bg = COLORED_COLORS[key] || COLORED_COLORS['other'];
      const iconSize = size > 16 ? size - 4 : 12;
      return (
        <div style={{
          width: size + 8, height: size + 8, borderRadius: 8,
          backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={iconSize} strokeWidth={2} color="white" />
        </div>
      );
    }
  }
}
