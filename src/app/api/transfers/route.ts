import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const transfers = await db.transfer.findMany({
    include: { from: true, to: true },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return NextResponse.json(transfers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fromId, toId, amount, note } = body;

  if (!fromId || !toId || !amount) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }
  if (fromId === toId) {
    return NextResponse.json({ error: '不能转到同一个账户' }, { status: 400 });
  }

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return NextResponse.json({ error: '金额无效' }, { status: 400 });
  }

  const transfer = await db.transfer.create({
    data: { fromId, toId, amount: amt, note: note || '' },
    include: { from: true, to: true },
  });

  // Update balances
  await db.channel.update({ where: { id: fromId }, data: { balance: { decrement: amt } } });
  await db.channel.update({ where: { id: toId }, data: { balance: { increment: amt } } });

  return NextResponse.json(transfer, { status: 201 });
}
