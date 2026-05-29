import { PrismaClient } from '../src/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const db = new PrismaClient({ adapter });

async function main() {
  // 先清空已有数据（保证幂等）
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

  // 渠道
  await db.channel.create({ data: { name: '微信', type: 'payment' } });
  await db.channel.create({ data: { name: '支付宝', type: 'payment' } });
  await db.channel.create({ data: { name: '银行卡', type: 'payment' } });
  await db.channel.create({ data: { name: '现金', type: 'payment' } });
  await db.channel.create({ data: { name: '工资卡', type: 'income' } });

  // 示例交易
  const wx = await db.channel.findFirst({ where: { name: '微信' } });
  const bank = await db.channel.findFirst({ where: { name: '银行卡' } });
  const alipay = await db.channel.findFirst({ where: { name: '支付宝' } });

  await db.transaction.createMany({
    data: [
      { type: 'expense', amount: 25, date: '2026-05-29', categoryId: dining!.id, channelId: alipay!.id, note: '午餐' },
      { type: 'expense', amount: 3000, date: '2026-05-28', categoryId: housing!.id, channelId: wx!.id, note: '房租' },
      { type: 'income', amount: 12500, date: '2026-05-28', categoryId: salary!.id, channelId: bank!.id, note: '5月工资' },
      { type: 'expense', amount: 50, date: '2026-05-27', categoryId: transport!.id, channelId: wx!.id, note: '打车' },
      { type: 'expense', amount: 200, date: '2026-05-28', categoryId: shopping!.id, channelId: alipay!.id, note: '日用品' },
      { type: 'expense', amount: 128, date: '2026-05-25', categoryId: entertainment!.id, channelId: wx!.id, note: '游戏' },
      { type: 'income', amount: 500, date: '2026-05-26', categoryId: invest!.id, channelId: bank!.id, note: '基金收益' },
    ],
  });

  console.log('Seed data inserted');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
