import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const createTables = `
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS VerificationCode (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expiresAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS Category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  type TEXT NOT NULL,
  parentId TEXT,
  budgetLimit REAL,
  userId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (parentId) REFERENCES Category(id)
);

CREATE TABLE IF NOT EXISTS Channel (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  userId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS Transfer (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  note TEXT,
  fromId TEXT NOT NULL,
  toId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fromId) REFERENCES Channel(id),
  FOREIGN KEY (toId) REFERENCES Channel(id)
);

CREATE TABLE IF NOT EXISTS Transaction (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  categoryId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  projectId TEXT,
  userId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES Category(id),
  FOREIGN KEY (channelId) REFERENCES Channel(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS TransactionSplit (
  id TEXT PRIMARY KEY,
  transactionId TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY (transactionId) REFERENCES Transaction(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES Category(id)
);

CREATE TABLE IF NOT EXISTS RecurringRule (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  dayOfMonth INTEGER NOT NULL DEFAULT 1,
  nextDueDate TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  categoryId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  userId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES Category(id),
  FOREIGN KEY (channelId) REFERENCES Channel(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE TABLE IF NOT EXISTS CategorizationRule (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  channelId TEXT,
  amountMin REAL,
  amountMax REAL,
  isActive INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  userId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES Category(id),
  FOREIGN KEY (channelId) REFERENCES Channel(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_category_userId ON Category(userId);
CREATE INDEX IF NOT EXISTS idx_channel_userId ON Channel(userId);
CREATE INDEX IF NOT EXISTS idx_transaction_userId ON Transaction(userId);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON Transaction(date);
CREATE INDEX IF NOT EXISTS idx_transaction_categoryId ON Transaction(categoryId);
CREATE INDEX IF NOT EXISTS idx_transaction_channelId ON Transaction(channelId);
CREATE INDEX IF NOT EXISTS idx_recurringRule_userId ON RecurringRule(userId);
CREATE INDEX IF NOT EXISTS idx_categorizationRule_userId ON CategorizationRule(userId);
CREATE INDEX IF NOT EXISTS idx_transfer_fromId ON Transfer(fromId);
CREATE INDEX IF NOT EXISTS idx_transfer_toId ON Transfer(toId);
CREATE INDEX IF NOT EXISTS idx_transactionSplit_transactionId ON TransactionSplit(transactionId);
`;

async function main() {
  console.log('Connecting to Turso...');

  // Check connection
  const result = await turso.execute("SELECT 1 as ok");
  console.log('Connection OK:', result.rows[0].ok === 1 ? 'Yes' : 'No');

  // Execute each statement separately (libsql's executeMultiple may not work)
  const statements = createTables
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s + ';');

  for (const stmt of statements) {
    try {
      await turso.execute(stmt);
      console.log('OK:', stmt.substring(0, 60) + '...');
    } catch (err) {
      console.error('FAIL:', stmt.substring(0, 60) + '...', err.message);
    }
  }

  // Verify tables were created
  const tables = await turso.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log('\nCreated tables:', tables.rows.map(r => r.name).join(', '));

  await turso.close();
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
