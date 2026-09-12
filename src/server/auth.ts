import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { db, nowIso } from "./db";
import { newId, safeParse } from "./util";
import type { User } from "@/lib/types";

const SESSION_COOKIE = "aetheria_session";
export const SESSION_COOKIE_NAME = SESSION_COOKIE;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface SessionRow {
  token: string;
  user_id: string;
  expires_at: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
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
  return getUserFromToken(token);
}

/** Works with a plain fetch Request (route handlers). */
export function getUserFromRequest(req: Request): User | null {
  // 1. Cookie (works in normal browser contexts)
  const token = readSessionToken(req.headers.get("cookie"));
  const cookieUser = getUserFromToken(token);
  if (cookieUser) return cookieUser;

  // 2. Authorization header (works in embedded/iframe contexts where
  //    third-party cookies are blocked)
  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    return getUserFromToken(auth.slice(7).trim());
  }
  return null;
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
  return getUserById(row.user_id);
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
    settings: safeParse(row.settings, {} as User["settings"]),
    createdAt: row.created_at,
  };
}

export function getUserById(id: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? mapUser(row) : null;
}

export function getUserByEmail(email: string): User | null {
  const row = db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email);
  return row ? mapUser(row) : null;
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

  const id = newId("usr");
  db.prepare(
    `INSERT INTO users (id, email, username, password_hash, age_verified, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    email,
    username,
    hashPassword(input.password),
    input.ageVerified ? 1 : 0,
    nowIso()
  );

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

export function updateUserSettings(userId: string, settings: Record<string, unknown>): void {
  db.prepare("UPDATE users SET settings = ? WHERE id = ?").run(
    JSON.stringify(settings),
    userId
  );
}

export function verifyAge(userId: string): void {
  db.prepare("UPDATE users SET age_verified = 1 WHERE id = ?").run(userId);
}
