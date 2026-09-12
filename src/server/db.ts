import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "./schema";
import { seedIfEmpty } from "./seed";

const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "aetheria.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __dbSeedScheduled: boolean | undefined;
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
    (db.prepare("SELECT name FROM _migrations").all() as any[]).map(
      (r) => r.name
    )
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

function isBuildPhase(): boolean {
  // NEXT_PHASE is set only while `next build` / `next dev` is running.
  // It is unset at real runtime (`next start`).
  const phase = process.env.NEXT_PHASE || "";
  return phase.includes("build");
}

function createDb(): Database.Database {
  ensureDir();
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = createDb();

    // Seed demo content on the first real database access at RUNTIME.
    // Done synchronously so the very first request already sees content
    // (no empty-state flash on a fresh container). Skipped during
    // `next build`: page-data collection imports route modules in parallel
    // worker processes, and touching SQLite there causes SQLITE_BUSY lock
    // contention on a fresh container.
    if (!isBuildPhase() && !global.__dbSeedScheduled) {
      global.__dbSeedScheduled = true;
      try {
        if (seedIfEmpty()) console.log("[db] auto-seeded demo content");
      } catch (e) {
        console.error("[db] seed skipped:", (e as Error)?.message || e);
      }
    }
  }
  return global.__db;
}

// Lazy database handle. We deliberately do NOT open SQLite at import time:
// Next.js imports route modules during `next build` (page-data collection) in
// parallel worker processes, and eagerly opening/migrating the database there
// causes lock contention on a fresh container. This Proxy defers the real
// Database access until a query is actually executed at runtime.
//
// Note: methods are bound to the real Database instance so `db.prepare(...)`
// keeps its correct `this` (a plain Proxy get-trap that returns an unbound
// method would break every query).
export const db = new Proxy({} as Database.Database, {
  get(_target, prop: string | symbol) {
    const real = getDb();
    const value = (real as any)[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export function nowIso(): string {
  return new Date().toISOString();
}
