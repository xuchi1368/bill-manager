import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const rules = await db.categorizationRule.findMany({
    include: { category: true, channel: true },
    orderBy: { priority: 'desc' },
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
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
    },
    include: { category: true, channel: true },
  });
  return NextResponse.json(rule, { status: 201 });
}
