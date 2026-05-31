import { PrismaClient } from '../src/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const adapter = new PrismaBetterSqlite3({
  url: `file:${path.join(__dirname, '..', 'dev.db')}`,
});
const db = new PrismaClient({ adapter });

async function main() {
  // 先清空已有数据（保证幂等）
  await db.transfer.deleteMany();
  await db.transaction.deleteMany();
  await db.channel.deleteMany();
  await db.category.deleteMany();

  // 支出分类
  const dining = await db.category.create({ data: { name: '餐饮', icon: '🍜', type: 'expense' } });
  const transport = await db.category.create({ data: { name: '交通', icon: '🚗', type: 'expense' } });
  const shopping = await db.category.create({ data: { name: '购物', icon: '🛒', type: 'expense' } });
  const housing = await db.category.create({ data: { name: '房租', icon: '🏠', type: 'expense' } });
  const entertainment = await db.category.create({ data: { name: '娱乐', icon: '🎮', type: 'expense' } });

  // 收入分类
  const salary = await db.category.create({ data: { name: '工资', icon: '💰', type: 'income' } });
  const invest = await db.category.create({ data: { name: '投资收益', icon: '📈', type: 'income' } });
  await db.category.create({ data: { name: '其他收入', icon: '🎁', type: 'income' } });

  // 渠道 (with initial balances)
  const wx = await db.channel.create({ data: { name: '微信', type: 'payment', balance: 5000 } });
  const alipay = await db.channel.create({ data: { name: '支付宝', type: 'payment', balance: 3000 } });
  const bank = await db.channel.create({ data: { name: '银行卡', type: 'payment', balance: 50000 } });
  await db.channel.create({ data: { name: '现金', type: 'payment', balance: 2000 } });
  await db.channel.create({ data: { name: '工资卡', type: 'income', balance: 0 } });

  // 示例交易
  const txData = [
    { type: 'expense', amount: 25, date: '2026-05-29', categoryId: dining!.id, channelId: alipay.id, note: '午餐' },
    { type: 'expense', amount: 3000, date: '2026-05-28', categoryId: housing!.id, channelId: wx.id, note: '房租' },
    { type: 'income', amount: 12500, date: '2026-05-28', categoryId: salary!.id, channelId: bank.id, note: '5月工资' },
    { type: 'expense', amount: 50, date: '2026-05-27', categoryId: transport!.id, channelId: wx.id, note: '打车' },
    { type: 'expense', amount: 200, date: '2026-05-28', categoryId: shopping!.id, channelId: alipay.id, note: '日用品' },
    { type: 'expense', amount: 128, date: '2026-05-25', categoryId: entertainment!.id, channelId: wx.id, note: '游戏' },
    { type: 'income', amount: 500, date: '2026-05-26', categoryId: invest!.id, channelId: bank.id, note: '基金收益' },
  ];
  await db.transaction.createMany({ data: txData });

  // Compute channel balances from initial balance + transactions
  const channelDeltas = new Map<string, number>();
  for (const t of txData) {
    const delta = t.type === 'expense' ? -t.amount : t.amount;
    channelDeltas.set(t.channelId, (channelDeltas.get(t.channelId) || 0) + delta);
  }
  for (const chId of Array.from(channelDeltas.keys())) {
    await db.channel.update({ where: { id: chId }, data: { balance: { increment: channelDeltas.get(chId)! } } });
  }

  console.log('Seed data inserted');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
