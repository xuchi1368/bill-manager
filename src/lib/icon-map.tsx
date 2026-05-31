import {
  UtensilsCrossed, Car, ShoppingCart, Home, Gamepad2, Pill, Smartphone,
  Gift, Plane, GraduationCap, Briefcase, Wrench, Package, Heart, Star,
  Flame, Coffee, Sandwich, Pizza, CupSoda, Bus, Fuel, Shirt, Sparkles,
  Film, Music, Laptop, Lightbulb, Droplets, BookOpen, Cat, CreditCard,
  Brush, Cake, Dumbbell, Scissors, Building2, Banknote, Landmark,
  MessageCircle, CircleDollarSign, Bitcoin, type LucideIcon
} from 'lucide-react';

// Category emoji → Lucide icon
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  '🍜': UtensilsCrossed, '🍔': Sandwich, '🍕': Pizza, '🥤': CupSoda, '☕': Coffee,
  '🚗': Car, '🚌': Bus, '⛽': Fuel,
  '🛒': ShoppingCart, '👗': Shirt, '💄': Sparkles,
  '🎮': Gamepad2, '🎬': Film, '🎵': Music,
  '📱': Smartphone, '💻': Laptop,
  '🏠': Home, '💡': Lightbulb, '💧': Droplets,
  '📚': BookOpen, '💊': Pill, '🐱': Cat,
  '🎁': Gift, '✈️': Plane, '🏥': Building2, '🎓': GraduationCap,
  '💰': CircleDollarSign, '📈': Star, '💼': Briefcase, '🏦': Building2,
  '🧾': CreditCard, '💳': CreditCard, '🧹': Brush,
  '🎂': Cake, '⚽': Star, '🏋️': Dumbbell, '🧘': Sparkles, '💇': Scissors,
  '🔧': Wrench, '📦': Package, '❤️': Heart, '🌟': Star, '🔥': Flame,
};

// Channel name → Lucide icon
const CHANNEL_ICON_MAP: Record<string, LucideIcon> = {
  '微信': MessageCircle, '支付宝': CircleDollarSign,
  '银行卡': CreditCard, '现金': Banknote, '工资卡': Building2,
};

export function getCategoryIcon(emoji: string): LucideIcon {
  return CATEGORY_ICON_MAP[emoji] || Package;
}

export function getChannelIcon(name: string): LucideIcon {
  return CHANNEL_ICON_MAP[name] || CreditCard;
}

export { CATEGORY_ICON_MAP, CHANNEL_ICON_MAP };
