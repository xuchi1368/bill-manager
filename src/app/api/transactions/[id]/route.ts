import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function delta(type: string, amount: number) {
  return type === 'income' ? amount : -amount;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { type, amount, date, note, categoryId, channelId, splits } = body;

  // Get old transaction to reverse its balance effect
  const old = await db.transaction.findUnique({ where: { id: params.id } });
  const newAmount = parseFloat(amount);

  // Reverse old balance effect
  if (old) {
    await db.channel.update({ where: { id: old.channelId }, data: { balance: { increment: -delta(old.type, old.amount) } } });
    // Apply new balance effect
    await db.channel.update({ where: { id: channelId }, data: { balance: { increment: delta(type, newAmount) } } });
  }

  // Replace splits: delete old, create new
  if (splits !== undefined) {
    await db.transactionSplit.deleteMany({ where: { transactionId: params.id } });
  }

  const transaction = await db.transaction.update({
    where: { id: params.id },
    data: {
      type, amount: newAmount, date, note, categoryId, channelId,
      ...(splits && splits.length > 0 ? { splits: { create: splits.map((s: { categoryId: string; amount: number }) => ({ categoryId: s.categoryId, amount: s.amount })) } } : {}),
    },
    include: { category: true, channel: true, splits: { include: { category: true } } },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // Reverse balance before deleting
  const old = await db.transaction.findUnique({ where: { id: params.id } });
  if (old) {
    await db.channel.update({ where: { id: old.channelId }, data: { balance: { increment: -delta(old.type, old.amount) } } });
  }
  await db.transaction.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
