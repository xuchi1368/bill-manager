import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const libsql = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const adapter = new PrismaLibSql(libsql);
  return new PrismaClient({ adapter });
}

let _db: PrismaClient;

function getDb(): PrismaClient {
  if (!_db) {
    _db = globalForPrisma.prisma ?? createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _db;
    }
  }
  return _db;
}

// Use Proxy so `db.model.findMany()` style still works
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});
