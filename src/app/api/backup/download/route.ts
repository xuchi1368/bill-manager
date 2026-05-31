import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const dbPath = join(process.cwd(), 'dev.db');
    const buffer = readFileSync(dbPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `账单管理_备份_${timestamp}.db`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: `备份失败: ${(e as Error).message}` }, { status: 500 });
  }
}
