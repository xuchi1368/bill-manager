import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.keyword !== undefined) data.keyword = body.keyword;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId;
  if (body.channelId !== undefined) data.channelId = body.channelId;
  if (body.amountMin !== undefined) data.amountMin = body.amountMin;
  if (body.amountMax !== undefined) data.amountMax = body.amountMax;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const rule = await db.categorizationRule.update({
    where: { id: params.id, userId },
    data,
    include: { category: true, channel: true },
  });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  await db.categorizationRule.delete({ where: { id: params.id, userId } });
  return NextResponse.json({ success: true });
}
