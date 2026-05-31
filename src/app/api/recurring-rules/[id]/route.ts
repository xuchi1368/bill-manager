import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
  if (body.type !== undefined) updateData.type = body.type;
  if (body.frequency !== undefined) updateData.frequency = body.frequency;
  if (body.dayOfMonth !== undefined) updateData.dayOfMonth = parseInt(body.dayOfMonth);
  if (body.nextDueDate !== undefined) updateData.nextDueDate = body.nextDueDate;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
  if (body.channelId !== undefined) updateData.channelId = body.channelId;

  const rule = await db.recurringRule.update({
    where: { id: params.id, userId },
    data: updateData,
    include: { category: true, channel: true },
  });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  await db.recurringRule.delete({ where: { id: params.id, userId } });
  return NextResponse.json({ success: true });
}
