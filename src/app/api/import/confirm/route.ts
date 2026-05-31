import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  try {
    const body = await req.json();
    const { transactions } = body as {
      transactions: {
        date: string;
        type: string;
        amount: number;
        counterparty: string;
        description: string;
        method: string;
        categoryId: string;
        channelId: string;
      }[];
    };

    if (!transactions?.length) {
      return NextResponse.json({ error: '没有可导入的交易数据' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const t of transactions) {
      if (!t.categoryId || !t.channelId || !t.amount || !t.date) {
        skipped++;
        continue;
      }

      await db.transaction.create({
        data: {
          type: t.type,
          amount: t.amount,
          date: t.date,
          note: `${t.counterparty} ${t.description} [${t.method}]`.trim(),
          categoryId: t.categoryId,
          channelId: t.channelId,
          userId,
        },
      });

      // Update channel balance
      const delta = t.type === 'expense' ? -t.amount : t.amount;
      await db.channel.update({ where: { id: t.channelId, userId }, data: { balance: { increment: delta } } });

      imported++;
    }

    return NextResponse.json({ imported, skipped });
  } catch (e) {
    return NextResponse.json({ error: `导入失败: ${(e as Error).message}` }, { status: 500 });
  }
}
