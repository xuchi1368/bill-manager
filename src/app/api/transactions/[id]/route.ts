import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { type, amount, date, note, categoryId, channelId } = body;

  const transaction = await db.transaction.update({
    where: { id: params.id },
    data: { type, amount: parseFloat(amount), date, note, categoryId, channelId },
    include: { category: true, channel: true },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.transaction.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
