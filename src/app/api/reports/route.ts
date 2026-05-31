import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { getCurrentMonth } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const [s, e] = startDate && endDate ? [startDate, endDate] : getCurrentMonth();

  const transactions = await db.transaction.findMany({
    where: { date: { gte: s, lte: e }, userId },
    include: { category: true, channel: true, splits: { include: { category: true } } },
    orderBy: { date: 'asc' },
  });

  // Summary totals
  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of transactions) {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  }

  // Category distribution (split-aware)
  const categoryMap = new Map<string, { name: string; icon: string; income: number; expense: number }>();
  for (const t of transactions) {
    if (t.splits && t.splits.length > 0) {
      for (const sp of t.splits) {
        const key = sp.categoryId;
        if (!categoryMap.has(key)) {
          categoryMap.set(key, { name: sp.category.name, icon: sp.category.icon, income: 0, expense: 0 });
        }
        const entry = categoryMap.get(key)!;
        if (t.type === 'income') entry.income += sp.amount;
        else entry.expense += sp.amount;
      }
    } else {
      const key = t.categoryId;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { name: t.category.name, icon: t.category.icon, income: 0, expense: 0 });
      }
      const entry = categoryMap.get(key)!;
      if (t.type === 'income') entry.income += t.amount;
      else entry.expense += t.amount;
    }
  }

  const categoryDistribution = Array.from(categoryMap.values())
    .map(({ name, icon, income, expense }) => ({
      name, icon, income: Math.round(income * 100) / 100, expense: Math.round(expense * 100) / 100, total: Math.round((income + expense) * 100) / 100,
    })).sort((a, b) => b.total - a.total);

  // Channel distribution
  const channelMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const name = t.channel.name;
    channelMap.set(name, (channelMap.get(name) || 0) + t.amount);
  }
  const channelDistribution = Array.from(channelMap.entries())
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  // Month-over-month comparison: this period vs previous same-length period
  const periodLen = new Date(e).getTime() - new Date(s).getTime();
  const prevStart = new Date(new Date(s).getTime() - periodLen - 86400000).toISOString().split('T')[0];
  const prevEnd = new Date(new Date(s).getTime() - 86400000).toISOString().split('T')[0];

  const prevTransactions = await db.transaction.findMany({
    where: { type: 'expense', date: { gte: prevStart, lte: prevEnd }, userId },
    include: { category: true, splits: { include: { category: true } } },
  });

  const prevCategoryMap = new Map<string, number>();
  let prevTotal = 0;
  for (const t of prevTransactions) {
    if (t.splits && t.splits.length > 0) {
      for (const sp of t.splits) {
        prevCategoryMap.set(sp.category.name, (prevCategoryMap.get(sp.category.name) || 0) + sp.amount);
        prevTotal += sp.amount;
      }
    } else {
      prevCategoryMap.set(t.category.name, (prevCategoryMap.get(t.category.name) || 0) + t.amount);
      prevTotal += t.amount;
    }
  }

  // Merge current + previous by category
  const momCategorySet = new Set<string>();
  for (const t of transactions) {
    if (t.type === 'expense') momCategorySet.add(t.category.name);
  }
  for (const name of Array.from(prevCategoryMap.keys())) momCategorySet.add(name);

  const momComparison = Array.from(momCategorySet).map((name) => {
    const current = categoryDistribution.find((c) => c.name === name && c.expense > 0);
    const curAmt = current?.expense || 0;
    const prevAmt = Math.round((prevCategoryMap.get(name) || 0) * 100) / 100;
    const change = prevAmt > 0 ? Math.round(((curAmt - prevAmt) / prevAmt) * 100) : (curAmt > 0 ? 100 : 0);
    return { name, current: curAmt, previous: prevAmt, change };
  }).sort((a, b) => b.current - a.current);

  // Daily trend within the period
  const trendMap = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    if (!trendMap.has(t.date)) trendMap.set(t.date, { income: 0, expense: 0 });
    const entry = trendMap.get(t.date)!;
    if (t.type === 'income') entry.income += t.amount;
    else entry.expense += t.amount;
  }
  const dailyTrend = Array.from(trendMap.entries()).map(([date, val]) => ({
    date, income: Math.round(val.income * 100) / 100, expense: Math.round(val.expense * 100) / 100,
  }));

  return NextResponse.json({
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    balance: Math.round((totalIncome - totalExpense) * 100) / 100,
    categoryDistribution,
    channelDistribution,
    momComparison,
    dailyTrend,
    period: { start: s, end: e, prevStart, prevEnd },
  });
}
