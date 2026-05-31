import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const transfers = await db.transfer.findMany({
    where: { userId },
    include: { from: true, to: true },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return NextResponse.json(transfers);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

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
    data: { fromId, toId, amount: amt, note: note || '', userId },
    include: { from: true, to: true },
  });

  // Update balances
  await db.channel.update({ where: { id: fromId, userId }, data: { balance: { decrement: amt } } });
  await db.channel.update({ where: { id: toId, userId }, data: { balance: { increment: amt } } });

  return NextResponse.json(transfer, { status: 201 });
}
