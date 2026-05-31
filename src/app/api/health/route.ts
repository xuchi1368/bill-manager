export const dynamic = 'force-dynamic';

export async function GET() {
  // Check ALL env vars (safe)
  const keys = Object.keys(process.env).filter(k =>
    k.includes('DATABASE') || k.includes('TURSO') || k.includes('JWT') || k.includes('VERCEL')
  );
  const env: Record<string, string> = {};
  for (const k of keys) {
    env[k] = process.env[k] ? 'SET' : 'EMPTY';
  }

  return Response.json({
    totalEnvKeys: Object.keys(process.env).length,
    matching: env,
  });
}
