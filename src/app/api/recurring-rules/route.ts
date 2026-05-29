import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const rules = await db.recurringRule.findMany({
    include: { category: true, channel: true },
    orderBy: { nextDueDate: 'asc' },
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, amount, type, frequency, dayOfMonth, nextDueDate, categoryId, channelId } = body;

  const rule = await db.recurringRule.create({
    data: {
      name, amount: parseFloat(amount), type, frequency,
      dayOfMonth: parseInt(dayOfMonth) || 1,
      nextDueDate, categoryId, channelId,
    },
    include: { category: true, channel: true },
  });

  return NextResponse.json(rule, { status: 201 });
}
