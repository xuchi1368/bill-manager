import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');
const PUBLIC_PATHS = ['/login', '/api/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('bill-auth')?.value;
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const res = pathname.startsWith('/api/')
      ? NextResponse.json({ error: '登录已过期' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('bill-auth');
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
