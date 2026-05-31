import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const yearMonth = searchParams.get('yearMonth');
  if (!yearMonth) return NextResponse.json({ error: 'yearMonth required' }, { status: 400 });

  const [year, month] = yearMonth.split('-').map(Number);
  const firstDay = `${yearMonth}-01`;
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

  const transactions = await db.transaction.findMany({
    where: { date: { gte: firstDay, lte: lastDay }, userId },
    include: { category: true, channel: true, splits: { include: { category: true } } },
    orderBy: { date: 'asc' },
  });

  const dayMap = new Map<string, { income: number; expense: number; items: typeof transactions }>();
  for (const t of transactions) {
    if (!dayMap.has(t.date)) dayMap.set(t.date, { income: 0, expense: 0, items: [] });
    const entry = dayMap.get(t.date)!;
    if (t.type === 'income') entry.income += t.amount;
    else entry.expense += t.amount;
    entry.items.push(t);
  }

  let totalIncome = 0;
  let totalExpense = 0;

  const days = Array.from(dayMap.entries()).map(([date, val]) => {
    totalIncome += val.income;
    totalExpense += val.expense;
    return {
      date,
      income: Math.round(val.income * 100) / 100,
      expense: Math.round(val.expense * 100) / 100,
      count: val.items.length,
      items: val.items,
    };
  });

  return NextResponse.json({
    yearMonth,
    days,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
  });
}
