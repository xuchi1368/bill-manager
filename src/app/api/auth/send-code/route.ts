import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCode } from '@/lib/auth';
import { sendSMS } from '@/lib/sms';

export async function POST(req: Request) {
  const { phone } = await req.json();
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 });
  }

  // 清理过期验证码
  try {
    await db.verificationCode.deleteMany({ where: { phone, expiresAt: { lt: new Date() } } });

    const code = generateCode();
    await db.verificationCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendSMS(phone, code);
    // TODO: 接入短信后删除此行，改为不返回 code
    return NextResponse.json({
      ok: true,
      code,  // 临时：直接返回验证码方便测试
    });
  } catch (err: any) {
    console.error('[send-code]', err);
    return NextResponse.json({ error: '服务器错误: ' + (err.message || '未知') }, { status: 500 });
  }
}
