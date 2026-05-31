import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const rules = await db.categorizationRule.findMany({
    where: { userId },
    include: { category: true, channel: true },
    orderBy: { priority: 'desc' },
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await req.json();
  const { keyword, categoryId, channelId, amountMin, amountMax, priority, isActive } = body;
  if (!keyword || !categoryId) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }
  const rule = await db.categorizationRule.create({
    data: {
      keyword, categoryId,
      channelId: channelId || null,
      amountMin: amountMin ?? null,
      amountMax: amountMax ?? null,
      priority: priority ?? 0,
      isActive: isActive ?? true,
      userId,
    },
    include: { category: true, channel: true },
  });
  return NextResponse.json(rule, { status: 201 });
}
