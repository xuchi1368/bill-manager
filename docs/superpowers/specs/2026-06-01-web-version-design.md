# 账单管理网页版 设计规格

**日期**: 2026-06-01  
**状态**: 设计确认，待实现

## 目标

将当前 Electron 桌面应用改造为网页版 SaaS，用户通过浏览器访问，手机号注册登录，数据存储在云数据库。

## 方案选择

| 决策 | 选择 | 原因 |
|------|------|------|
| 部署平台 | Vercel（免费） | 零成本，Next.js 原生支持 |
| 数据库 | Turso（免费 9GB） | SQLite 兼容，Prisma 适配器现成 |
| 登录方式 | 手机号 + 短信验证码 | 国内用户习惯 |
| 桌面版 | 先保留，后续决定 | 网页版上线后再评估 |

## 架构对比

```
现在 (Desktop)                    改后 (Web)
─────────────────────────        ─────────────────────────
SQLite 本地文件    →             Turso 云数据库
better-sqlite3     →             @prisma/adapter-turso
无登录             →             手机号 + 短信验证码
无用户隔离         →             所有数据关联 userId
Electron 壳        →             浏览器打开
next dev           →             Vercel 部署
```

## 技术细节

### 数据库迁移

- 适配器：`@prisma/adapter-better-sqlite3` → `@prisma/adapter-turso`（配合 `@libsql/client`）
- Turso 数据库 URL + auth token 通过环境变量注入
- 所有现有表加 `userId TEXT NOT NULL` 字段
- 数据迁移：导出 `dev.db` → 导入 Turso

### 用户认证

- User 表：`id`, `phone`, `createdAt`
- 验证码表：`id`, `phone`, `code`, `expiresAt`
- 短信服务：阿里云 SMS API（¥0.03/条）
- 登录/注册合并为同一页面 `/login`：输入手机号 → 发验证码 → 输入验证码 → 新用户自动注册，老用户直接登录
- Session：JWT token 存入 httpOnly cookie

### 数据隔离

所有现有表增加 `userId`：
```prisma
model Transaction {
  // ... 现有字段 ...
  userId  String
  user    User     @relation(fields: [userId], references: [id])
}

model Category { /* + userId */ }
model Channel   { /* + userId */ }
// ... 以此类推
```

所有 API 路由：
- 从 cookie 读取 JWT 获取 userId
- 查询/修改时自动过滤 `WHERE userId = currentUser`
- 非登录用户访问任何页面 → 重定向到 `/login`

### 浏览器适配

- `TitleBar` 组件在非 Electron 环境已返回 null（无需修改）
- `electron` 依赖和脚本保留，不受影响
- `ELECTRON_SKIP_SERVER=1` 行为不变

### 部署

- Vercel：连接 GitHub 仓库，检测到 Next.js 自动配置
- 环境变量：`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `SMS_API_KEY`, `SMS_API_SECRET`
- 构建命令：`next build`（Vercel 自动执行）

## 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | 添加 User、VerificationCode 模型，所有现有模型加 userId |
| `src/lib/db.ts` | 修改 | 适配器切换为 Turso |
| `src/lib/auth.ts` | **新建** | JWT 签发/验证、验证码生成/校验 |
| `src/lib/sms.ts` | **新建** | 阿里云短信发送 |
| `src/middleware.ts` | **新建** | 路由保护，未登录重定向 |
| `src/app/login/page.tsx` | **新建** | 登录/注册页面 |
| `src/app/api/auth/send-code/route.ts` | **新建** | 发送验证码 API |
| `src/app/api/auth/verify/route.ts` | **新建** | 验证码校验 + 登录/注册 + 签发 JWT |
| `src/app/api/auth/logout/route.ts` | **新建** | 退出登录 |
| `package.json` | 修改 | 添加 `@libsql/client`, `@prisma/adapter-turso`, `jose`, 移除 `better-sqlite3` |
| `.env` | 修改 | 添加 Turso/JWT/SMS 环境变量 |

## 不变更

- 所有页面 UI 组件（仪表盘、记账、报表、设置、日期选择器等）
- Electron 相关代码（保留，条件化）
- prisma.config.ts 结构

## 费用

| 项目 | 月费 |
|------|------|
| Vercel | ¥0 |
| Turso | ¥0（9GB 存储，10亿行读取） |
| 短信 | ~¥5-20（阿里云 0.03/条） |
| **合计** | **~¥5-20/月** |

## 用户流程

```
新用户：打开网址 → 输入手机号 → 收到验证码 → 输入验证码 → 自动注册 → 进入主页（空数据）
老用户：打开网址 → 输入手机号 → 收到验证码 → 输入验证码 → 登录成功 → 进入主页（已有数据）
```
