import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, "aetheria.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function migrate(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const applied = new Set(
    db.prepare("SELECT name FROM _migrations").all().map((r: any) => r.name)
  );

  const tx = db.transaction(() => {
    for (const m of MIGRATIONS) {
      if (applied.has(m.name)) continue;
      db.exec(m.sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(m.name);
    }
  });
  tx();
}

function createDb(): Database.Database {
  ensureDir();
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = createDb();
  }
  return global.__db;
}

export const db = getDb();

// Auto-seed demo content on a fresh database (e.g. a brand-new deployment).
// Deferred to avoid a circular-import race with ./seed.
setTimeout(() => {
  import("./seed")
    .then(({ seedIfEmpty }) => {
      if (seedIfEmpty()) console.log("[db] auto-seeded demo content");
    })
    .catch(() => {
      /* seeding is best-effort */
    });
}, 0);

export function nowIso(): string {
  return new Date().toISOString();
}
