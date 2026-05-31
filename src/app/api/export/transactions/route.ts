import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';
  const type = searchParams.get('type') || '';
  const categoryId = searchParams.get('category_id') || '';

  const where: any = {};
  if (dateFrom) where.date = { ...where.date, gte: dateFrom };
  if (dateTo) where.date = { ...where.date, lte: dateTo };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;

  const transactions = await db.transaction.findMany({
    where,
    include: { category: true, channel: true },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  // UTF-8 BOM for Excel compatibility
  const BOM = '﻿';
  const headers = ['日期', '类型', '金额', '分类', '渠道', '备注'];
  const rows = transactions.map(t => [
    t.date,
    t.type === 'income' ? '收入' : '支出',
    t.amount.toFixed(2),
    t.category.name,
    t.channel.name,
    t.note || '',
  ]);

  const csv = BOM + [
    headers.join(','),
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const filename = `账单导出_${dateFrom || '全部'}_${dateTo || '全部'}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
