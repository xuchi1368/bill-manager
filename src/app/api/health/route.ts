import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      }
    });
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      db: 'disconnected',
      error: e.message?.slice(0, 200),
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      }
    }, { status: 500 });
  }
}
