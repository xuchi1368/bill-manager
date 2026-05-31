import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');
const COOKIE_NAME = 'bill-auth';

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.sub as string;
  } catch {
    return null;
  }
}

export async function getUserId(): Promise<string | null> {
  const cookie = (await cookies()).get(COOKIE_NAME);
  if (!cookie) return null;
  return verifyToken(cookie.value);
}

export async function setAuthCookie(userId: string) {
  const token = await signToken(userId);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearAuthCookie() {
  (await cookies()).delete(COOKIE_NAME);
}

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
