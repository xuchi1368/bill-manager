import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const channels = await db.channel.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(channels);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, balance } = body;
  const channel = await db.channel.create({
    data: { name, type, balance: balance ? parseFloat(balance) : 0 },
  });
  return NextResponse.json(channel, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, balance } = body;
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (balance !== undefined) data.balance = parseFloat(balance);
  const channel = await db.channel.update({ where: { id }, data });
  return NextResponse.json(channel);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
  await db.channel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
