import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';
import { seedUserData } from '@/lib/seed';

export async function POST(req: Request) {
  const { phone, code } = await req.json();

  const record = await db.verificationCode.findFirst({
    where: { phone, code, expiresAt: { gt: new Date() } },
  });

  if (!record) {
    return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
  }

  await db.verificationCode.delete({ where: { id: record.id } });

  // Find or create user
  let user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    user = await db.user.create({ data: { phone } });
    await seedUserData(user.id);
  }

  await setAuthCookie(user.id);
  return NextResponse.json({ ok: true });
}
