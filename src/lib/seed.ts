import { db } from './db';

const DEFAULT_CATEGORIES = [
  { name: '餐饮', icon: '🍜', type: 'expense' },
  { name: '交通', icon: '🚗', type: 'expense' },
  { name: '购物', icon: '🛒', type: 'expense' },
  { name: '房租', icon: '🏠', type: 'expense' },
  { name: '娱乐', icon: '🎮', type: 'expense' },
  { name: '工资', icon: '💰', type: 'income' },
  { name: '兼职', icon: '💼', type: 'income' },
  { name: '其他收入', icon: '🎁', type: 'income' },
];

const DEFAULT_CHANNELS = [
  { name: '微信', type: 'payment', balance: 0 },
  { name: '支付宝', type: 'payment', balance: 0 },
  { name: '银行卡', type: 'payment', balance: 0 },
];

export async function seedUserData(userId: string) {
  const existing = await db.category.findFirst({ where: { userId } });
  if (existing) return;

  for (const cat of DEFAULT_CATEGORIES) {
    await db.category.create({ data: { ...cat, userId } });
  }
  for (const ch of DEFAULT_CHANNELS) {
    await db.channel.create({ data: { ...ch, userId } });
  }
}
