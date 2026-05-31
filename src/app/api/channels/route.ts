import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const channels = await db.channel.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(channels);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await req.json();
  const { name, type, balance } = body;
  const channel = await db.channel.create({
    data: { name, type, balance: balance ? parseFloat(balance) : 0, userId },
  });
  return NextResponse.json(channel, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const body = await req.json();
  const { id, name, balance } = body;
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (balance !== undefined) data.balance = parseFloat(balance);
  const channel = await db.channel.update({ where: { id, userId }, data });
  return NextResponse.json(channel);
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
  await db.channel.delete({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
