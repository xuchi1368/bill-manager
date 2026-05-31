import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const where: Record<string, unknown> = { userId };
  if (type) where.type = type;
  const categories = await db.category.findMany({ where, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await req.json();
  const { name, icon, type, budgetLimit } = body;
  const category = await db.category.create({
    data: { name, icon: icon || '📦', type, budgetLimit: budgetLimit ? parseFloat(budgetLimit) : null, userId },
  });
  return NextResponse.json(category, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await req.json();
  const { id, name, icon, budgetLimit } = body;
  const category = await db.category.update({
    where: { id, userId },
    data: {
      ...(name && { name }),
      ...(icon && { icon }),
      ...(budgetLimit !== undefined && { budgetLimit: parseFloat(String(budgetLimit)) }),
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
  await db.category.delete({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
