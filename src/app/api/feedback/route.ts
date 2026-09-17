import { json, readBody } from "@/server/http";

export const runtime = "nodejs";

/**
 * In-app feedback form. Relayed server-side to the owner's inbox via
 * FormSubmit (https://formsubmit.co) so the email address never appears
 * in client-side code. Rate limited + honeypot to deter spam.
 */
const FEEDBACK_INBOX = "mustafasammar37@gmail.com";
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${FEEDBACK_INBOX}`;

// Simple in-memory per-IP limiter: max 5 submissions / 10 minutes.
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

  try {
    const res = await fetch(FORMSUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `Chatworld feedback${contact ? ` from ${contact}` : ""}`,
        _template: "table",
        message,
        reply_to: contact || "(not provided)",
      }),
    });
    if (!res.ok) throw new Error(`relay status ${res.status}`);
    return json({ ok: true });
  } catch {
    return json({ error: "Couldn't send your feedback right now. Please try again shortly." }, 502);
  }
}
