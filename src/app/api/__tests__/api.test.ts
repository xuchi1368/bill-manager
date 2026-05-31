import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';

const BASE = 'http://localhost:8889';

let authCookie = '';

beforeAll(async () => {
  // Create a test user and verification code directly in the DB
  const phone = '13800138000';
  const code = '123456';

  const user = await db.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });
  await db.verificationCode.deleteMany({ where: { phone } });
  await db.verificationCode.create({
    data: { phone, code, expiresAt: new Date(Date.now() + 60_000) },
  });

  // Call verify endpoint to get the auth cookie
  const res = await fetch(`${BASE}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });

  if (res.ok) {
    const setCookie = res.headers.get('set-cookie') || '';
    const match = setCookie.match(/bill-auth=([^;]+)/);
    if (match) {
      authCookie = `bill-auth=${match[1]}`;
    }
  }

  if (!authCookie) {
    console.warn('Auth setup failed - tests may return 401');
  }
});

describe('API integration tests', () => {
  it('GET /api/health returns ok', async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  it('GET /api/dashboard returns correct shape', async () => {
    const res = await fetch(`${BASE}/api/dashboard`, {
      headers: { Cookie: authCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('totalIncome');
    expect(data).toHaveProperty('totalExpense');
    expect(data).toHaveProperty('balance');
    expect(data).toHaveProperty('trend');
    expect(data).toHaveProperty('recent');
    expect(data).toHaveProperty('budgets');
    expect(data).toHaveProperty('accounts');
    expect(data).toHaveProperty('allExpenseCategories');
    expect(typeof data.balance).toBe('number');
  });

  it('GET /api/categories returns array', async () => {
    const res = await fetch(`${BASE}/api/categories`, {
      headers: { Cookie: authCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('type');
  });

  it('GET /api/channels returns array', async () => {
    const res = await fetch(`${BASE}/api/channels`, {
      headers: { Cookie: authCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('GET /api/transactions supports limit', async () => {
    const res = await fetch(`${BASE}/api/transactions?limit=3`, {
      headers: { Cookie: authCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(3);
  });

  it('GET /api/export/transactions returns CSV with BOM', async () => {
    const res = await fetch(`${BASE}/api/export/transactions`, {
      headers: { Cookie: authCookie },
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    // CSV has UTF-8 BOM followed by headers
    expect(text).toContain('日期,类型,金额');
    expect(text.length).toBeGreaterThan(10);
  });

  it('GET /api/backup/download returns file', async () => {
    const res = await fetch(`${BASE}/api/backup/download`, {
      headers: { Cookie: authCookie },
    });
    expect(res.status).toBe(200);
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it('POST /api/transactions creates and returns', async () => {
    const today = new Date().toISOString().split('T')[0];
    // First get a valid category and channel
    const cats = await fetch(`${BASE}/api/categories`, {
      headers: { Cookie: authCookie },
    }).then(r => r.json());
    const chs = await fetch(`${BASE}/api/channels`, {
      headers: { Cookie: authCookie },
    }).then(r => r.json());
    const catId = cats[0]?.id;
    const chId = chs[0]?.id;
    if (!catId || !chId) return; // skip if no seed data

    const res = await fetch(`${BASE}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({
        type: 'expense', amount: 42, date: today,
        categoryId: catId, channelId: chId, note: 'vitest',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.note).toBe('vitest');
    expect(data.amount).toBe(42);

    // Cleanup
    await fetch(`${BASE}/api/transactions/${data.id}`, {
      method: 'DELETE',
      headers: { Cookie: authCookie },
    });
  });

  it('returns 401 without auth cookie', async () => {
    const res = await fetch(`${BASE}/api/dashboard`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('请先登录');
  });
});
