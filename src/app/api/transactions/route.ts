import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matchCategory } from '@/lib/categorization';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const categoryId = searchParams.get('categoryId');
  const channelId = searchParams.get('channelId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = parseInt(searchParams.get('limit') || '50');

  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (channelId) where.channelId = channelId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, string>).gte = startDate;
    if (endDate) (where.date as Record<string, string>).lte = endDate;
  }
  if (search) {
    where.note = { contains: search };
  }

  const transactions = await db.transaction.findMany({
    where,
    include: { category: true, channel: true, splits: { include: { category: true } } },
    orderBy: { date: 'desc' },
    take: limit,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, amount, date, note, categoryId: userCategoryId, channelId, splits } = body;

  if (!type || !amount || !date || !channelId) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }
  if (!userCategoryId && !(splits && splits.length > 0)) {
    return NextResponse.json({ error: '请选择分类' }, { status: 400 });
  }

  // Auto-categorization via rules
  let categoryId = userCategoryId || '';
  let matchedRuleName: string | null = null;
  const ruleMatch = await matchCategory(note || '');
  if (ruleMatch && !userCategoryId) {
    categoryId = ruleMatch.categoryId;
    matchedRuleName = ruleMatch.categoryName;
  }

  const amt = parseFloat(amount);

  // Validate splits if present
  if (splits && splits.length > 0) {
    const splitsSum = splits.reduce((s: number, sp: { amount: number }) => s + sp.amount, 0);
    if (Math.abs(splitsSum - amt) > 0.01) {
      return NextResponse.json({ error: `分项金额合计 ¥${splitsSum.toFixed(2)} 与总金额 ¥${amt.toFixed(2)} 不匹配` }, { status: 400 });
    }
    if (!categoryId) categoryId = splits[0].categoryId;
  }

  const transaction = await db.transaction.create({
    data: {
      type, amount: amt, date, note: note || '', categoryId, channelId,
      ...(splits && splits.length > 0 ? { splits: { create: splits.map((s: { categoryId: string; amount: number }) => ({ categoryId: s.categoryId, amount: s.amount })) } } : {}),
    },
    include: { category: true, channel: true, splits: { include: { category: true } } },
  });

  // Auto-update channel balance
  const delta = type === 'expense' ? -amt : amt;
  await db.channel.update({ where: { id: channelId }, data: { balance: { increment: delta } } });

  return NextResponse.json({ ...transaction, matchedRuleName }, { status: 201 });
}
