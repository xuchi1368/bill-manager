import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const rules = await db.recurringRule.findMany({
    where: { userId },
    include: { category: true, channel: true },
    orderBy: { nextDueDate: 'asc' },
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await req.json();
  const { name, amount, type, frequency, dayOfMonth, nextDueDate, categoryId, channelId } = body;

  const rule = await db.recurringRule.create({
    data: {
      name, amount: parseFloat(amount), type, frequency,
      dayOfMonth: parseInt(dayOfMonth) || 1,
      nextDueDate, categoryId, channelId, userId,
    },
    include: { category: true, channel: true },
  });

  return NextResponse.json(rule, { status: 201 });
}
