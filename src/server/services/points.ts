import { db, nowIso } from "../db";
import { newId } from "../util";
import crypto from "node:crypto";

/* ------------------------------------------------------------------ */
/* Config (env-tunable, sane defaults)                                 */
/* ------------------------------------------------------------------ */
export const DAILY_POINTS = intEnv("DAILY_POINTS", 500);
export const MESSAGE_COST = intEnv("MESSAGE_COST", 50);
// Welcome grant so a brand-new account can send its first messages immediately,
// before discovering the daily claim. Server-side only; never trust the client.
export const STARTING_POINTS = intEnv("STARTING_POINTS", 150);

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  const n = parseInt(v || "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export interface PointBalance {
  balance: number;
  updatedAt: string;
}

export interface PointTransaction {
  id: string;
  amount: number; // signed
  kind: string;
  note: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function ensureBalance(userId: string): number {
  const row = db
    .prepare("SELECT balance FROM point_balances WHERE user_id = ?")
    .get(userId) as any;
  if (row) return row.balance;
  db.prepare(
    "INSERT INTO point_balances (user_id, balance, updated_at) VALUES (?, 0, ?)"
  ).run(userId, nowIso());
  return 0;
}

function insertTx(userId: string, amount: number, kind: string, note: string) {
  db.prepare(
    `INSERT INTO point_transactions (id, user_id, amount, kind, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(newId("ptx"), userId, amount, kind, note, nowIso());
}

export function getBalance(userId: string): number {
  return ensureBalance(userId);
}

export function listTransactions(
  userId: string,
  limit = 50
): PointTransaction[] {
  const rows = db
    .prepare(
      `SELECT * FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(userId, limit) as any[];
  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    kind: r.kind,
    note: r.note,
    createdAt: r.created_at,
  }));
}

/* ------------------------------------------------------------------ */
/* Spend (atomic check + deduct)                                       */
/* ------------------------------------------------------------------ */
export interface SpendResult {
  ok: boolean;
  balance: number;
  required: number;
}

export function spendPoints(
  userId: string,
  amount: number,
  kind: string,
  note: string
): SpendResult {
  const tx = db.transaction((): SpendResult => {
    const balance = ensureBalance(userId);
    if (balance < amount) {
      return { ok: false, balance, required: amount };
    }
    const next = balance - amount;
    db.prepare(
      "UPDATE point_balances SET balance = ?, updated_at = ? WHERE user_id = ?"
    ).run(next, nowIso(), userId);
    insertTx(userId, -amount, kind, note);
    return { ok: true, balance: next, required: amount };
  });
  return tx();
}

/* ------------------------------------------------------------------ */
/* Add                                                                 */
/* ------------------------------------------------------------------ */
export function addPoints(
  userId: string,
  amount: number,
  kind: string,
  note: string
): number {
  const tx = db.transaction(() => {
    const balance = ensureBalance(userId);
    const next = balance + amount;
    db.prepare(
      "UPDATE point_balances SET balance = ?, updated_at = ? WHERE user_id = ?"
    ).run(next, nowIso(), userId);
    insertTx(userId, amount, kind, note);
    return next;
  });
  return tx();
}

/* ------------------------------------------------------------------ */
/* Starter grant (idempotent — exactly once per account)               */
/* ------------------------------------------------------------------ */
export function grantStarterPoints(userId: string): number {
  const tx = db.transaction((): number => {
    const already = db
      .prepare(
        "SELECT 1 FROM point_transactions WHERE user_id = ? AND kind = 'starter' LIMIT 1"
      )
      .get(userId);
    if (already) return getBalance(userId);
    return addPoints(
      userId,
      STARTING_POINTS,
      "starter",
      "Welcome to Chatworld — your story begins."
    );
  });
  return tx();
}

/* ------------------------------------------------------------------ */
/* Daily claim + streaks                                               */
/* ------------------------------------------------------------------ */
function todayKey(): string {
  // UTC calendar day; deterministic across the fleet.
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10);
}

export function streakBonus(streak: number): number {
  // +25 per consecutive day, capped at +250 (streak 11+).
  return Math.min(Math.max(streak - 1, 0), 10) * 25;
}

export function getStreak(userId: string): number {
  const row = db
    .prepare("SELECT streak FROM point_claims WHERE user_id = ?")
    .get(userId) as any;
  return row?.streak ?? 0;
}

export function canClaimDaily(userId: string): boolean {
  const row = db
    .prepare("SELECT last_claim_date FROM point_claims WHERE user_id = ?")
    .get(userId) as any;
  return !row || row.last_claim_date !== todayKey();
}

export interface ClaimResult {
  claimed: boolean;
  amount: number;
  bonus: number;
  streak: number;
  balance: number;
}

export function claimDaily(userId: string): ClaimResult {
  const tx = db.transaction((): ClaimResult => {
    if (!canClaimDaily(userId)) {
      return {
        claimed: false,
        amount: 0,
        bonus: 0,
        streak: getStreak(userId),
        balance: getBalance(userId),
      };
    }

    const row = db
      .prepare("SELECT last_claim_date, streak FROM point_claims WHERE user_id = ?")
      .get(userId) as any;
    const streak =
      row && row.last_claim_date === yesterdayKey() ? (row.streak || 0) + 1 : 1;

    db.prepare(
      `INSERT INTO point_claims (user_id, last_claim_date, streak) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET last_claim_date = excluded.last_claim_date, streak = excluded.streak`
    ).run(userId, todayKey(), streak);

    const bonus = streakBonus(streak);
    const amount = DAILY_POINTS + bonus;
    const balance = addPoints(
      userId,
      amount,
      "daily",
      `Daily bonus${bonus ? ` (${streak}-day streak)` : ""}`
    );
    return { claimed: true, amount, bonus, streak, balance };
  });
  return tx();
}

/* ------------------------------------------------------------------ */
/* Redeem codes                                                        */
/* ------------------------------------------------------------------ */
export interface RedeemResult {
  ok: boolean;
  amount?: number;
  balance: number;
  error?: string;
}

export function redeemCode(userId: string, rawCode: string): RedeemResult {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, balance: getBalance(userId), error: "Enter a code." };

  const tx = db.transaction((): RedeemResult => {
    const row = db
      .prepare("SELECT * FROM point_codes WHERE code = ?")
      .get(code) as any;
    if (!row) {
      return { ok: false, balance: getBalance(userId), error: "Invalid code." };
    }
    if (row.used_by) {
      return { ok: false, balance: getBalance(userId), error: "Code already used." };
    }
    db.prepare("UPDATE point_codes SET used_by = ? WHERE id = ?").run(userId, row.id);
    const balance = addPoints(userId, row.amount, "redeem", `Redeemed code ${code}`);
    return { ok: true, amount: row.amount, balance };
  });
  return tx();
}

/* ------------------------------------------------------------------ */
/* Code management (admin / seed)                                      */
/* ------------------------------------------------------------------ */
export function createCode(amount: number, code?: string): string {
  const value = (code || randomCode()).toUpperCase();
  db.prepare(
    "INSERT INTO point_codes (id, code, amount, created_at) VALUES (?, ?, ?, ?)"
  ).run(newId("pcd"), value, amount, nowIso());
  return value;
}

function randomCode(): string {
  // Cryptographically secure — redeem codes grant points and must not be
  // predictable (Math.random() is not suitable for security-sensitive tokens).
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[crypto.randomInt(chars.length)];
  }
  return out;
}
