import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: '请选择备份文件' }, { status: 400 });

    // Validate file extension
    if (!file.name.endsWith('.db')) {
      return NextResponse.json({ error: '仅支持 .db 格式的备份文件' }, { status: 400 });
    }

    const dbPath = join(process.cwd(), 'dev.db');
    const backupDir = join(process.cwd(), 'backups');

    // Save current DB as safety copy before overwriting
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
    const safetyName = `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.db`;
    copyFileSync(dbPath, join(backupDir, safetyName));

    // Write uploaded file
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(dbPath, buffer);

    return NextResponse.json({
      success: true,
      message: '数据已恢复，请刷新页面。恢复前备份已保存到 backups/ 目录',
      safetyBackup: safetyName,
    });
  } catch (e) {
    return NextResponse.json({ error: `恢复失败: ${(e as Error).message}` }, { status: 500 });
  }
}
