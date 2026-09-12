// Admin service: privileged operations for site administrators.
// Every function here must be called from a route that has already verified
// the caller is an admin (see requireAdmin in http.ts). These helpers only
// perform data operations and record audit entries.

import { db, nowIso } from "./db";
import { newId } from "./util";
import { addPoints, getBalance } from "./services/points";
import crypto from "node:crypto";

function audit(adminUserId: string, action: string, targetUserId: string | null, detail: string) {
  db.prepare(
    `INSERT INTO admin_audit (id, admin_user_id, action, target_user_id, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(newId("aud"), adminUserId, action, targetUserId, detail, nowIso());
}

export interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  plan: string;
  isAdmin: boolean;
  banned: boolean;
  ageVerified: boolean;
  createdAt: string;
  balance: number;
  messageCount: number;
  conversationCount: number;
}

export function listUsers(query?: string): AdminUserRow[] {
  const q = (query || "").trim();
  const rows = db
    .prepare(
      `SELECT * FROM users
       WHERE (? = '' OR lower(username) LIKE ? OR lower(email) LIKE ?)
       ORDER BY created_at DESC LIMIT 200`
    )
    .all(q, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`) as any[];

  return rows.map((r) => {
    const msg = db
      .prepare("SELECT COUNT(*) AS n FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = ?")
      .get(r.id) as any;
    const conv = db.prepare("SELECT COUNT(*) AS n FROM conversations WHERE user_id = ?").get(r.id) as any;
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      plan: r.plan,
      isAdmin: !!r.is_admin,
      banned: !!r.banned,
      ageVerified: !!r.age_verified,
      createdAt: r.created_at,
      balance: getBalance(r.id),
      messageCount: msg?.n ?? 0,
      conversationCount: conv?.n ?? 0,
    };
  });
}

export interface AdminStats {
  users: number;
  characters: number;
  worlds: number;
  conversations: number;
  messages: number;
  memories: number;
  pointsInCirculation: number;
  totalTransactions: number;
  admins: number;
  banned: number;
}

export function getStats(): AdminStats {
  const one = (sql: string) => {
    const r = db.prepare(sql).get() as any;
    return r?.n ?? 0;
  };
  const bal = db
    .prepare("SELECT COALESCE(SUM(balance), 0) AS s FROM point_balances")
    .get() as any;
  return {
    users: one("SELECT COUNT(*) AS n FROM users"),
    characters: one("SELECT COUNT(*) AS n FROM characters"),
    worlds: one("SELECT COUNT(*) AS n FROM worlds"),
    conversations: one("SELECT COUNT(*) AS n FROM conversations"),
    messages: one("SELECT COUNT(*) AS n FROM messages"),
    memories: one("SELECT COUNT(*) AS n FROM memories"),
    pointsInCirculation: bal?.s ?? 0,
    totalTransactions: one("SELECT COUNT(*) AS n FROM point_transactions"),
    admins: one("SELECT COUNT(*) AS n FROM users WHERE is_admin = 1"),
    banned: one("SELECT COUNT(*) AS n FROM users WHERE banned = 1"),
  };
}

/** Grant (positive) or deduct (negative) points from any user, with no cap. */
export function adminGrantPoints(
  adminUserId: string,
  targetUserId: string,
  amount: number,
  note: string
): number {
  if (!Number.isFinite(amount) || amount === 0) throw new Error("Invalid amount.");
  const balance = amount > 0
    ? addPoints(targetUserId, amount, "admin_grant", note)
    : addPoints(targetUserId, amount, "admin_deduct", note);
  audit(adminUserId, amount > 0 ? "grant_points" : "deduct_points", targetUserId, `${amount} (${note})`);
  return balance;
}

/** Directly set a user's balance (override). */
export function adminSetBalance(
  adminUserId: string,
  targetUserId: string,
  balance: number
): number {
  if (!Number.isInteger(balance) || balance < 0) throw new Error("Invalid balance.");
  db.prepare(
    `INSERT INTO point_balances (user_id, balance, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET balance = excluded.balance, updated_at = excluded.updated_at`
  ).run(targetUserId, balance, nowIso());
  audit(adminUserId, "set_balance", targetUserId, `→ ${balance}`);
  return balance;
}

export function adminSetRole(adminUserId: string, targetUserId: string, isAdmin: boolean): void {
  db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(isAdmin ? 1 : 0, targetUserId);
  audit(adminUserId, isAdmin ? "promote" : "demote", targetUserId, "");
}

export function adminSetBanned(adminUserId: string, targetUserId: string, banned: boolean): void {
  db.prepare("UPDATE users SET banned = ? WHERE id = ?").run(banned ? 1 : 0, targetUserId);
  // Banning signs the user out everywhere immediately.
  if (banned) {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(targetUserId);
  }
  audit(adminUserId, banned ? "ban" : "unban", targetUserId, "");
}

export function adminCreateCode(adminUserId: string, amount: number, count: number): string[] {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Invalid amount.");
  const n = Math.min(Math.max(1, count), 50);
  const codes: string[] = [];
  const tx = db.transaction(() => {
    for (let i = 0; i < n; i++) {
      const code = randomCode();
      db.prepare(
        "INSERT INTO point_codes (id, code, amount, created_at) VALUES (?, ?, ?, ?)"
      ).run(newId("pcd"), code, amount, nowIso());
      codes.push(code);
    }
  });
  tx();
  audit(adminUserId, "create_codes", null, `${n}× ${amount}`);
  return codes;
}

export function listRecentAudit(limit = 100): any[] {
  const rows = db
    .prepare(
      `SELECT a.*, u.username AS admin_username, t.username AS target_username
       FROM admin_audit a
       LEFT JOIN users u ON u.id = a.admin_user_id
       LEFT JOIN users t ON t.id = a.target_user_id
       ORDER BY a.created_at DESC LIMIT ?`
    )
    .all(limit) as any[];
  return rows.map((r) => ({
    id: r.id,
    adminUsername: r.admin_username || r.admin_user_id,
    targetUsername: r.target_username || r.target_user_id,
    action: r.action,
    detail: r.detail,
    createdAt: r.created_at,
  }));
}

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}
