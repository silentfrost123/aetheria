import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { db, nowIso } from "./db";
import { newId, safeParse } from "./util";
import type { User } from "@/lib/types";

const SESSION_COOKIE = "aetheria_session";
export const SESSION_COOKIE_NAME = SESSION_COOKIE;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// A dummy bcrypt hash used to equalize login timing for unknown emails,
// preventing a timing side-channel that would allow account enumeration.
export const DUMMY_HASH = bcrypt.hashSync("aetheria-timing-equalizer", 12);

// Emails that are treated as site administrators. Comma-separated. Matching
// accounts are auto-promoted (is_admin=1) on login/registration so the flag
// can never be lost, and this list is the single source of truth.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "mustafasannar99@gmail.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(String(email || "").trim().toLowerCase());
}

interface SessionRow {
  token: string;
  user_id: string;
  expires_at: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).run(token, userId, nowIso(), new Date(Date.now() + SESSION_TTL_MS).toISOString());
  return token;
}

export function destroySession(token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

function readSessionToken(cookieHeader: string | undefined | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === SESSION_COOKIE) return rest.join("=");
  }
  return null;
}

export function getSessionUser(req: NextRequest): User | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return withoutPasswordHash(getUserFromToken(token));
}

/** Works with a plain fetch Request (route handlers). */
export function getUserFromRequest(req: Request): User | null {
  // 1. Cookie (works in normal browser contexts)
  const token = readSessionToken(req.headers.get("cookie"));
  const cookieUser = getUserFromToken(token);
  if (cookieUser) return withoutPasswordHash(cookieUser);

  // 2. Authorization header (works in embedded/iframe contexts where
  //    third-party cookies are blocked)
  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    return withoutPasswordHash(getUserFromToken(auth.slice(7).trim()));
  }
  return null;
}

/** Strip the password hash from a user object so it can never leak from a route. */
function withoutPasswordHash(user: User | null): User | null {
  if (!user) return null;
  const { passwordHash: _omit, ...rest } = user;
  return rest as User;
}

export function getUserFromToken(token: string | null | undefined): User | null {
  if (!token) return null;
  const row = db
    .prepare("SELECT * FROM sessions WHERE token = ?")
    .get(token) as SessionRow | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  const user = getUserById(row.user_id);
  // Banned users are immediately signed out: reject the token and delete it.
  if (user?.banned) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return user;
}

export function setSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

// ---- User helpers ----

function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    avatar: row.avatar,
    bio: row.bio,
    plan: row.plan,
    isAdmin: !!row.is_admin,
    ageVerified: !!row.age_verified,
    banned: !!row.banned,
    settings: safeParse(row.settings, {} as User["settings"]),
    createdAt: row.created_at,
  };
}

/**
 * Auto-promote a user to admin when their email is in the admin list but the
 * persisted flag is stale. Keeps the admin list authoritative and idempotent.
 */
function ensureAdminFlag(user: User): User {
  if (isAdminEmail(user.email) && !user.isAdmin) {
    db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(user.id);
    return { ...user, isAdmin: true };
  }
  return user;
}

export function getUserById(id: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? ensureAdminFlag(mapUser(row)) : null;
}

export function getUserByEmail(email: string): User | null {
  const row = db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email);
  return row ? ensureAdminFlag(mapUser(row)) : null;
}

export function getUserByUsername(username: string): User | null {
  const row = db
    .prepare("SELECT * FROM users WHERE lower(username) = lower(?)")
    .get(username);
  return row ? ensureAdminFlag(mapUser(row)) : null;
}

export function publicUser(user: User) {
  const { passwordHash, email, ...rest } = user;
  return { ...rest, email: user.email };
}

export function createUser(input: {
  email: string;
  username: string;
  password: string;
  ageVerified?: boolean;
}): { user: User | null; error?: string } {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { user: null, error: "Invalid email address." };
  }
  if (username.length < 3 || username.length > 24) {
    return { user: null, error: "Username must be 3–24 characters." };
  }
  if (input.password.length < 8) {
    return { user: null, error: "Password must be at least 8 characters." };
  }
  if (getUserByEmail(email)) {
    return { user: null, error: "An account with this email already exists." };
  }
  if (getUserByUsername(username)) {
    return { user: null, error: "That username is already taken." };
  }

  const id = newId("usr");
  const isAdmin = isAdminEmail(email) ? 1 : 0;
  try {
    db.prepare(
      `INSERT INTO users (id, email, username, password_hash, is_admin, age_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      email,
      username,
      hashPassword(input.password),
      isAdmin,
      input.ageVerified ? 1 : 0,
      nowIso()
    );
  } catch (e: any) {
    // Defense in depth: handle a race where the username/email was claimed
    // between the check above and the INSERT (concurrent registration).
    if (String(e?.code).includes("SQLITE_CONSTRAINT")) {
      return {
        user: null,
        error: getUserByEmail(email)
          ? "An account with this email already exists."
          : "That username is already taken.",
      };
    }
    throw e;
  }

  // Default persona for the new user
  db.prepare(
    `INSERT INTO personas (id, user_id, name, personality, appearance, background, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId("per"),
    id,
    "You",
    "Brave, curious, and sharp-witted.",
    "A traveler with a story yet untold.",
    "A stranger drawn into extraordinary worlds.",
    nowIso()
  );

  const user = getUserById(id);
  return { user };
}

// Allowlist of user settings and their validators. Anything not listed is
// dropped, preventing mass assignment and arbitrary data from being persisted
// (and, for defaultModel, preventing cost-abuse via exotic model IDs).
const SETTING_VALIDATORS: Record<string, (v: unknown) => boolean> = {
  responseLength: (v) =>
    ["short", "medium", "long", "very_long", "adaptive"].includes(String(v)),
  narrationLevel: (v) => typeof v === "number" && v >= 0 && v <= 1,
  creativity: (v) => typeof v === "number" && v >= 0 && v <= 1,
  temperature: (v) => typeof v === "number" && v >= 0 && v <= 2,
  defaultModel: (v) =>
    typeof v === "string" && /^[A-Za-z0-9._:/-]{1,64}$/.test(v),
  useMemory: (v) => typeof v === "boolean",
  useLorebook: (v) => typeof v === "boolean",
  autoSummary: (v) => typeof v === "boolean",
  aiSuggestions: (v) => typeof v === "boolean",
  autoImageGen: (v) => typeof v === "boolean",
  fontScale: (v) => ["sm", "md", "lg"].includes(String(v)),
  reduceMotion: (v) => typeof v === "boolean",
  emailNotifications: (v) => typeof v === "boolean",
  newFollowerNotifications: (v) => typeof v === "boolean",
  replyNotifications: (v) => typeof v === "boolean",
};

function sanitizeSettings(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const validate = SETTING_VALIDATORS[k];
    if (validate && validate(v)) out[k] = v;
  }
  return out;
}

export function updateUserSettings(userId: string, settings: Record<string, unknown>): void {
  db.prepare("UPDATE users SET settings = ? WHERE id = ?").run(
    JSON.stringify(sanitizeSettings(settings)),
    userId
  );
}

export function verifyAge(userId: string): void {
  db.prepare("UPDATE users SET age_verified = 1 WHERE id = ?").run(userId);
}

export function deleteUser(userId: string): void {
  // Most child tables cascade on users(id) ON DELETE CASCADE; a few reference
  // users via a nullable FK (SET NULL), which is fine. Point tables cascade too.
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);
}
