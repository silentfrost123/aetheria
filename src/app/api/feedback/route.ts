import { json, readBody, requireUser } from "@/server/http";
import { db, nowIso } from "@/server/db";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

/**
 * Public feedback endpoint. Messages are stored in the site's own
 * admin inbox (/admin) — no third-party relay involved.
 * Rate limited + honeypot to deter spam.
 */
const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const body = (await readBody(req)) as {
    message?: string;
    contact?: string;
    website?: string; // honeypot — must stay empty
  };

  // Bots fill hidden fields.
  if (body?.website) return json({ ok: true });

  const message = (body?.message || "").trim();
  if (message.length < 10 || message.length > 4000) {
    return json({ error: "Please write between 10 and 4000 characters." }, 400);
  }
  const contact = (body?.contact || "").trim().slice(0, 200);
  if (contact && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) {
    return json({ error: "That reply-to email doesn't look right." }, 400);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) {
    return json({ error: "Too many messages just now. Please try again in a few minutes." }, 429);
  }
  recent.push(now);
  hits.set(ip, recent);

  const user = requireUser(req); // optional: signed-in users are linked, guests allowed
  db.prepare(
    "INSERT INTO feedback (id, user_id, contact, message, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(`fb_${nanoid(16)}`, user?.id || null, contact, message, nowIso());

  return json({ ok: true });
}
