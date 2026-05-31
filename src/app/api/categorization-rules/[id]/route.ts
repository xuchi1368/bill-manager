import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.keyword !== undefined) data.keyword = body.keyword;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const rule = await db.categorizationRule.update({
    where: { id: params.id },
    data,
    include: { category: true },
  });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.categorizationRule.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
