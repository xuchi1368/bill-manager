import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';
import { seedUserData } from '@/lib/seed';

export async function POST(req: Request) {
  const { phone } = await req.json();
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 });
  }

  // Find or create user
  let user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    user = await db.user.create({ data: { phone } });
    await seedUserData(user.id);
  }

  await setAuthCookie(user.id);
  return NextResponse.json({ ok: true });
}
