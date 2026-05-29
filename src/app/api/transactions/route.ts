import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const categoryId = searchParams.get('categoryId');
  const channelId = searchParams.get('channelId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (channelId) where.channelId = channelId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, string>).gte = startDate;
    if (endDate) (where.date as Record<string, string>).lte = endDate;
  }

  const transactions = await db.transaction.findMany({
    where,
    include: { category: true, channel: true },
    orderBy: { date: 'desc' },
    take: limit,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, amount, date, note, categoryId, channelId } = body;

  if (!type || !amount || !date || !categoryId || !channelId) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }

  const transaction = await db.transaction.create({
    data: { type, amount: parseFloat(amount), date, note: note || '', categoryId, channelId },
    include: { category: true, channel: true },
  });

  return NextResponse.json(transaction, { status: 201 });
}
