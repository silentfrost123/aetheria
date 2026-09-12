import { getUserByEmail, verifyPassword, createSession, setSessionCookie, publicUser, DUMMY_HASH } from "@/server/auth";
import { json, error, readBody } from "@/server/http";
import { rateLimit, clientIp } from "@/server/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await readBody<{ email: string; password: string }>(req);
  const email = (body.email || "").trim().toLowerCase();
  const ip = clientIp(req);

  // Per-account throttle (credential stuffing / targeted brute force) + a
  // coarse per-IP throttle (broad brute force). Returns 429 when exceeded.
  const acct = rateLimit(`login:acct:${email}`, 10, 15 * 60_000);
  const perIp = rateLimit(`login:ip:${ip}`, 60, 15 * 60_000);
  if (!acct.ok || !perIp.ok) {
    return json({ error: "Too many login attempts. Try again later." }, 429);
  }

  const user = getUserByEmail(email);

  // Always run a bcrypt comparison to equalize timing between "unknown email"
  // and "known email, wrong password", preventing account enumeration.
  const hash = user ? user.passwordHash : DUMMY_HASH;
  const ok = verifyPassword(body.password || "", hash);

  if (!user || !ok) {
    return error("Invalid email or password.", 401);
  }

  const token = createSession(user.id);
  const res = json({ user: publicUser(user), token });
  return setSessionCookie(res, token);
}
