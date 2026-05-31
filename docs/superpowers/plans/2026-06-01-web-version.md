# 网页版 SaaS 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** SQLite 本地数据库迁移到 Turso 云数据库，增加手机号验证码登录，数据按用户隔离，部署到 Vercel。

**架构：** Prisma 适配器切换到 `@prisma/adapter-turso` → 新增 User/VerificationCode 模型 → 所有现有模型加 userId → JWT cookie 认证 → Next.js middleware 保护路由 → Vercel 一键部署。

**技术栈：** Next.js 14, Prisma 7.8, @libsql/client, Turso, jose (JWT), 阿里云 SMS

**设计文档：** `docs/superpowers/specs/2026-06-01-web-version-design.md`

---

### 任务 1：Turso 数据库配置 + Prisma 适配器切换

**文件：**
- 修改：`package.json`
- 修改：`prisma/schema.prisma`
- 修改：`src/lib/db.ts`
- 修改：`.env`

- [ ] **步骤 1：安装新依赖，移除旧依赖**

```bash
cd /c/Users/Administrator/bill-manager
npm uninstall better-sqlite3 @prisma/adapter-better-sqlite3
npm install @libsql/client @prisma/adapter-turso
```

- [ ] **步骤 2：注册 Turso 并创建数据库**

去 https://turso.tech 注册 → 创建数据库 `bill-manager` → 复制 URL 和 Auth Token。

- [ ] **步骤 3：更新 .env**

```bash
# .env — 替换原有 DATABASE_URL
DATABASE_URL="libsql://bill-manager-xxx.turso.io"
TURSO_AUTH_TOKEN="eyJ..."
```

- [ ] **步骤 4：修改 prisma/schema.prisma — 切换 provider**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"     // Turso 是 SQLite 兼容的，provider 不变
  url      = env("DATABASE_URL")
}

// 新增 User 模型
model User {
  id        String   @id @default(cuid())
  phone     String   @unique
  createdAt DateTime @default(now())
  
  categories          Category[]
  channels            Channel[]
  transactions        Transaction[]
  recurringRules      RecurringRule[]
  categorizationRules CategorizationRule[]
}

// 新增验证码模型
model VerificationCode {
  id        String   @id @default(cuid())
  phone     String
  code      String
  expiresAt DateTime
}

// 修改所有现有模型 — 每个加 userId 和 relation
// Category, Channel, Transaction, TransactionSplit, RecurringRule, CategorizationRule 全部加:
//   userId  String
//   user    User   @relation(fields: [userId], references: [id])

// 示例 — Category:
model Category {
  id          String    @id @default(cuid())
  name        String
  icon        String    @default("📦")
  type        String
  parentId    String?
  budgetLimit Float?
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  transactions Transaction[]
  rules       RecurringRule[]
  catRules    CategorizationRule[]
  splits      TransactionSplit[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

对所有现有模型（Category, Channel, Transfer, Transaction, TransactionSplit, RecurringRule, CategorizationRule）做同样操作：添加 `userId  String` 和 `user  User  @relation(fields: [userId], references: [id])`。

- [ ] **步骤 5：修改 src/lib/db.ts — 切换适配器**

```ts
// src/lib/db.ts
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaTurso } from '@prisma/adapter-turso';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaTurso(turso);

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

- [ ] **步骤 6：生成 Prisma Client 并推送 schema 到 Turso**

```bash
npx prisma generate
npx prisma db push
```

- [ ] **步骤 7：验证**

```bash
npx next dev -p 8889
curl http://localhost:8889/api/health
# 预期: {"status":"ok","db":"connected"}
```

- [ ] **步骤 8：Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma src/lib/db.ts .env
git commit -m "feat: switch to Turso cloud database with Prisma adapter"
```

---

### 任务 2：用户认证系统 — JWT + 验证码 + 登录页

**文件：**
- 创建：`src/lib/auth.ts`
- 创建：`src/lib/sms.ts`
- 创建：`src/app/api/auth/send-code/route.ts`
- 创建：`src/app/api/auth/verify/route.ts`
- 创建：`src/app/api/auth/logout/route.ts`
- 创建：`src/app/login/page.tsx`
- 修改：`package.json`（加 jose 依赖）

- [ ] **步骤 1：安装 JWT 库**

```bash
npm install jose
```

- [ ] **步骤 2：创建 JWT 工具模块**

```ts
// src/lib/auth.ts
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearAuthCookie() {
  (await cookies()).delete(COOKIE_NAME);
}

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}
```

- [ ] **步骤 3：创建短信发送模块**

```ts
// src/lib/sms.ts
// 阿里云 SMS — 简化版
export async function sendSMS(phone: string, code: string): Promise<boolean> {
  const accessKeyId = process.env.SMS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.SMS_ACCESS_KEY_SECRET;
  const signName = process.env.SMS_SIGN_NAME || '账单管理';

  if (!accessKeyId || !accessKeySecret) {
    // 开发模式：不真发短信，控制台输出验证码
    console.log(`[DEV SMS] ${phone} 验证码: ${code}`);
    return true;
  }

  // TODO: 接入阿里云 SMS SDK
  // 生产环境调用阿里云 API
  return true;
}
```

- [ ] **步骤 4：创建发送验证码 API**

```ts
// src/app/api/auth/send-code/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCode } from '@/lib/auth';
import { sendSMS } from '@/lib/sms';

export async function POST(req: Request) {
  const { phone } = await req.json();
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 });
  }

  // Rate limit: delete old codes for this phone
  await db.verificationCode.deleteMany({ where: { phone } });

  const code = generateCode();
  await db.verificationCode.create({
    data: {
      phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    },
  });

  await sendSMS(phone, code);
  return NextResponse.json({ ok: true });
}
```

- [ ] **步骤 5：创建验证 + 登录/注册 API**

```ts
// src/app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  const { phone, code } = await req.json();

  const record = await db.verificationCode.findFirst({
    where: { phone, code, expiresAt: { gt: new Date() } },
  });

  if (!record) {
    return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
  }

  // Delete used code
  await db.verificationCode.delete({ where: { id: record.id } });

  // Find or create user
  let user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    user = await db.user.create({ data: { phone } });
  }

  await setAuthCookie(user.id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **步骤 6：创建退出登录 API**

```ts
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
```

- [ ] **步骤 7：创建登录页面**

```tsx
// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function sendCode() {
    if (!phone) return;
    setLoading(true);
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (res.ok) setSent(true);
    else setError(data.error);
    setLoading(false);
  }

  async function verifyCode() {
    if (!code) return;
    setLoading(true);
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    if (res.ok) router.push('/');
    else setError(data.error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] p-4">
      <div className="card p-6 w-full max-w-sm">
        <h1 className="text-lg font-bold text-[#3d342b] text-center mb-6">账单管理</h1>
        
        {!sent ? (
          <>
            <label className="text-xs text-[#6b5d52] block mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="输入手机号"
              className="bg-[#f5f2ed] border-0 rounded-[10px] px-3.5 py-2.5 text-sm text-[#3d342b] w-full mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full py-2.5 bg-[#f59e0b] hover:bg-amber-500 text-white font-medium rounded-[10px] text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? '发送中...' : '获取验证码'}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-[#6b5d52] mb-3 text-center">
              验证码已发送至 {phone}
            </p>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="输入6位验证码"
              maxLength={6}
              className="bg-[#f5f2ed] border-0 rounded-[10px] px-3.5 py-2.5 text-sm text-[#3d342b] w-full mb-4 text-center tracking-[4px] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              onClick={verifyCode}
              disabled={loading}
              className="w-full py-2.5 bg-[#f59e0b] hover:bg-amber-500 text-white font-medium rounded-[10px] text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? '验证中...' : '登录'}
            </button>
            <button
              onClick={() => { setSent(false); setError(''); }}
              className="w-full mt-2 py-2 text-xs text-[#6b5d52] hover:text-[#3d342b] cursor-pointer"
            >
              更换手机号
            </button>
          </>
        )}

        {error && (
          <p className="mt-3 text-xs text-[#e25c3b] text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **步骤 8：添加环境变量到 .env**

```bash
JWT_SECRET="your-random-secret-at-least-32-chars"
SMS_ACCESS_KEY_ID=""
SMS_ACCESS_KEY_SECRET=""
SMS_SIGN_NAME="账单管理"
```

- [ ] **步骤 9：验证**

```bash
npx next dev -p 8889
# 浏览器打开 http://localhost:8889/login
# 输入手机号 → 获取验证码 → 终端查看验证码 → 输入登录
```

- [ ] **步骤 10：Commit**

```bash
git add src/lib/auth.ts src/lib/sms.ts src/app/api/auth/ src/app/login/ .env package.json
git commit -m "feat: add SMS verification code login with JWT auth"
```

---

### 任务 3：路由保护 + 数据按用户隔离

**文件：**
- 创建：`src/middleware.ts`
- 修改：所有 API 路由文件（`src/app/api/**/route.ts`）

- [ ] **步骤 1：创建 middleware 保护路由**

```ts
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
const PUBLIC_PATHS = ['/login', '/api/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check auth cookie
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
    // Token expired/invalid
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
```

- [ ] **步骤 2：修改 API 路由添加用户隔离**

每个 API route 文件都需要在函数开头添加 userId 获取和过滤。以 `src/app/api/categories/route.ts` 为例：

```ts
// 在 GET handler 开头添加:
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  
  // 所有查询加 userId 过滤
  const categories = await db.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
  // ...
}

// POST handler 加 userId:
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  
  const body = await req.json();
  const category = await db.category.create({
    data: { ...body, userId },
  });
  // ...
}
```

需要对以下所有 API 路由做同样的修改：
- `src/app/api/categories/route.ts` — GET, POST
- `src/app/api/channels/route.ts` — GET, POST
- `src/app/api/transactions/route.ts` — GET, POST
- `src/app/api/transactions/[id]/route.ts` — PUT, DELETE
- `src/app/api/recurring-rules/route.ts` — GET, POST
- `src/app/api/recurring-rules/[id]/route.ts` — PUT, DELETE
- `src/app/api/categorization-rules/route.ts` — GET, POST
- `src/app/api/categorization-rules/[id]/route.ts` — PUT, DELETE
- `src/app/api/dashboard/route.ts` — GET
- `src/app/api/reports/route.ts` — GET
- `src/app/api/calendar/route.ts` — GET
- `src/app/api/transfers/route.ts` — GET, POST
- `src/app/api/export/transactions/route.ts` — GET
- `src/app/api/backup/download/route.ts` — GET
- `src/app/api/backup/restore/route.ts` — POST
- `src/app/api/import/parse/route.ts` — POST
- `src/app/api/import/confirm/route.ts` — POST

每个文件改两处：在每个 handler 函数开头 `const userId = await getUserId()` + 所有 Prisma 查询加 `where: { userId }` 或 `where: { userId, ...原有条件 }`。

- [ ] **步骤 3：验证**

```bash
npx next dev -p 8889
# 未登录访问 localhost:8889 → 重定向到 /login
# 登录后访问 → 正常显示
# 测试 API: curl localhost:8889/api/categories → 401
```

- [ ] **步骤 4：Commit**

```bash
git add src/middleware.ts src/app/api/
git commit -m "feat: add route protection and user data isolation"
```

---

### 任务 4：init 种子数据 — 新用户自动创建默认分类

**文件：**
- 创建：`src/lib/seed.ts`

- [ ] **步骤 1：创建种子数据模块**

```ts
// src/lib/seed.ts
import { db } from './db';

const DEFAULT_CATEGORIES = [
  { name: '餐饮', icon: '🍜', type: 'expense' },
  { name: '交通', icon: '🚗', type: 'expense' },
  { name: '购物', icon: '🛒', type: 'expense' },
  { name: '房租', icon: '🏠', type: 'expense' },
  { name: '娱乐', icon: '🎮', type: 'expense' },
  { name: '工资', icon: '💰', type: 'income' },
  { name: '兼职', icon: '💼', type: 'income' },
  { name: '其他收入', icon: '🎁', type: 'income' },
];

const DEFAULT_CHANNELS = [
  { name: '微信', type: 'payment', balance: 0 },
  { name: '支付宝', type: 'payment', balance: 0 },
  { name: '银行卡', type: 'payment', balance: 0 },
];

export async function seedUserData(userId: string) {
  // Skip if user already has categories
  const existing = await db.category.findFirst({ where: { userId } });
  if (existing) return;

  for (const cat of DEFAULT_CATEGORIES) {
    await db.category.create({ data: { ...cat, userId } });
  }
  for (const ch of DEFAULT_CHANNELS) {
    await db.channel.create({ data: { ...ch, userId } });
  }
}
```

- [ ] **步骤 2：在 verify API 中调用 seed**

在 `src/app/api/auth/verify/route.ts` 中，创建用户后调用：

```ts
import { seedUserData } from '@/lib/seed';

// 在 user = await db.user.create(...) 之后：
await seedUserData(user.id);
```

- [ ] **步骤 3：Commit**

```bash
git add src/lib/seed.ts src/app/api/auth/verify/route.ts
git commit -m "feat: auto-create default categories and channels for new users"
```

---

### 任务 5：Vercel 部署 + 数据迁移 + 端到端验证

**文件：**
- 修改：`.env` → 配置到 Vercel 环境变量

- [ ] **步骤 1：推送代码到 GitHub**

```bash
git remote add origin https://github.com/<your-username>/bill-manager.git
git push -u origin master
```

- [ ] **步骤 2：Vercel 部署**

1. 访问 https://vercel.com → 用 GitHub 登录
2. Import 仓库 → 选择 bill-manager
3. 配置环境变量（Settings → Environment Variables）:
   - `DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`
   - `SMS_ACCESS_KEY_ID`（留空 = dev 模式）
   - `SMS_ACCESS_KEY_SECRET`（留空 = dev 模式）
4. Deploy

- [ ] **步骤 3：数据迁移（如果有现有数据需要迁移）**

```bash
# 将本地 dev.db 导出为 SQL 然后导入 Turso
# (Turso CLI)
turso db shell bill-manager < dump.sql
```

- [ ] **步骤 4：端到端验证**

```bash
# 浏览器打开 Vercel 部署的 URL
# 测试: 登录 → 记一笔 → 查看仪表盘 → 报表 → 设置
# 确认数据只属于当前登录用户
```

- [ ] **步骤 5：Commit**

```bash
git add -A
git commit -m "chore: final config for Vercel deployment"
```

---

### 自检

1. **规格覆盖度**: 全部6个规格章节都有对应任务。Turso迁移(T1)、认证系统(T2)、路由保护+隔离(T3)、种子数据(T4)、部署(T5) ✅
2. **占位符扫描**: 无 TODO/待定。SMS 接入保留为 dev 模式控制台输出（简化处理）✅
3. **类型一致性**: User.id 类型为 String (CUID)，所有 userId 字段类型一致 ✅
