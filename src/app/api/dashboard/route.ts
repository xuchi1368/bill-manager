import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentMonth } from '@/lib/utils';

export async function GET() {
  const [monthStart, monthEnd] = getCurrentMonth();

  const [incomeResult, expenseResult] = await Promise.all([
    db.transaction.aggregate({
      where: { type: 'income', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { type: 'expense', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = incomeResult._sum.amount || 0;
  const totalExpense = expenseResult._sum.amount || 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startStr = thirtyDaysAgo.toISOString().split('T')[0];

  const recentTransactions = await db.transaction.findMany({
    where: { date: { gte: startStr } },
    orderBy: { date: 'asc' },
  });

  const trendMap = new Map<string, { income: number; expense: number }>();
  for (const t of recentTransactions) {
    if (!trendMap.has(t.date)) trendMap.set(t.date, { income: 0, expense: 0 });
    const entry = trendMap.get(t.date)!;
    if (t.type === 'income') entry.income += t.amount;
    else entry.expense += t.amount;
  }

  const trend = Array.from(trendMap.entries()).map(([date, val]) => ({ date, ...val }));

  const recent = await db.transaction.findMany({
    include: { category: true, channel: true },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 10,
  });

  // Budget tracking: each expense category with budgetLimit + actual spending this month
  const expenseCategories = await db.category.findMany({
    where: { type: 'expense', budgetLimit: { not: null } },
  });
  const budgets = await Promise.all(
    expenseCategories.map(async (cat) => {
      const result = await db.transaction.aggregate({
        where: { categoryId: cat.id, type: 'expense', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      });
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        budgetLimit: cat.budgetLimit!,
        spent: result._sum.amount || 0,
      };
    })
  );

  // Channel balances
  const channels = await db.channel.findMany({ orderBy: { createdAt: 'asc' } });
  const accounts = channels.map((c) => ({ id: c.id, name: c.name, type: c.type, balance: c.balance }));

  return NextResponse.json({
    totalIncome, totalExpense, balance: totalIncome - totalExpense,
    trend, recent, budgets, accounts,
  });
}
