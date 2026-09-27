import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { ensureSchema } from "./ensure-schema";
import { seedDatabase } from "./seed";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __clubSqlite?: Database.Database;
  __clubDb?: Db;
};

function databasePath() {
  if (process.env.CLUB_DB_PATH) return process.env.CLUB_DB_PATH;
  if (process.env.VERCEL) return path.join("/tmp", "club.db");
  return path.join(process.cwd(), "data", "club.db");
}

export function getDb(): Db {
  if (globalForDb.__clubDb) return globalForDb.__clubDb;

  const filePath = databasePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const sqlite = new Database(filePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  ensureSchema(sqlite);

  const db = drizzle(sqlite, { schema });
  seedDatabase(db);

  globalForDb.__clubSqlite = sqlite;
  globalForDb.__clubDb = db;
  return db;
}
