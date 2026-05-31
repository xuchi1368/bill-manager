import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentMonth } from '@/lib/utils';

export async function GET() {
  const [monthStart, monthEnd] = getCurrentMonth();

  // Use findMany + manual sum — Prisma 7.x aggregate() is broken with SQLite
  const sums = (rows: { amount: number }[]) => rows.reduce((s, r) => s + r.amount, 0);

  const [incomeRows, expenseRows] = await Promise.all([
    db.transaction.findMany({ where: { type: 'income', date: { gte: monthStart, lte: monthEnd } }, select: { amount: true } }),
    db.transaction.findMany({ where: { type: 'expense', date: { gte: monthStart, lte: monthEnd } }, select: { amount: true } }),
  ]);
  const totalIncome = sums(incomeRows);
  const totalExpense = sums(expenseRows);

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

  // Last month range
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = lastMonth.toISOString().split('T')[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  const budgets = await Promise.all(
    expenseCategories.map(async (cat) => {
      const [rows, lastRows] = await Promise.all([
        db.transaction.findMany({ where: { categoryId: cat.id, type: 'expense', date: { gte: monthStart, lte: monthEnd } }, select: { amount: true } }),
        db.transaction.findMany({ where: { categoryId: cat.id, type: 'expense', date: { gte: lastMonthStart, lte: lastMonthEnd } }, select: { amount: true } }),
      ]);
      const spent = sums(rows);
      const lastMonthSpent = sums(lastRows);
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        budgetLimit: cat.budgetLimit!,
        spent,
        lastMonthSpent,
      };
    })
  );

  // Channel balances
  const channels = await db.channel.findMany({ orderBy: { createdAt: 'asc' } });
  const accounts = channels.map((c) => ({ id: c.id, name: c.name, type: c.type, balance: c.balance }));

  const allExpenseCategories = await db.category.findMany({
    where: { type: 'expense' },
    select: { id: true, name: true, icon: true, budgetLimit: true },
  });

  return NextResponse.json({
    totalIncome, totalExpense, balance: totalIncome - totalExpense,
    trend, recent, budgets, accounts, allExpenseCategories,
  });
}
