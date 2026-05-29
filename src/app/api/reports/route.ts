import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentMonth } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const [s, e] = startDate && endDate ? [startDate, endDate] : getCurrentMonth();

  const transactions = await db.transaction.findMany({
    where: { type: 'expense', date: { gte: s, lte: e } },
    include: { channel: true },
  });

  const channelMap = new Map<string, number>();
  for (const t of transactions) {
    const name = t.channel.name;
    channelMap.set(name, (channelMap.get(name) || 0) + t.amount);
  }

  const channelDistribution = Array.from(channelMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({ channelDistribution });
}
