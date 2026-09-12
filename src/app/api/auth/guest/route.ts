import { json } from "@/server/http";
import { newId } from "@/server/util";
import crypto from "node:crypto";
import {
  createUser,
  createSession,
  publicUser,
} from "@/server/auth";
import { rateLimit, clientIp } from "@/server/rateLimit";

export const runtime = "nodejs";

/**
 * Auto-provisions a *fresh, isolated* guest session so the app is usable with
 * zero friction, even in embedded/preview environments where cookies and
 * localStorage are blocked.
 *
 * Each guest gets a unique throwaway user account (never a shared one), so a
 * guest's conversations, memories, points and content are never visible to any
 * other guest. Returns a token the client can hold in memory.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`guest:ip:${ip}`, 30, 60 * 60_000);
  if (!rl.ok) {
    return json({ error: "Too many guest sessions. Try again later." }, 429);
  }

  const stamp = crypto.randomBytes(12).toString("hex");
  const email = `guest_${stamp}@guest.aetheria.dev`;
  const username = `Guest${stamp.slice(0, 8)}`;

  const res = createUser({
    email,
    username,
    password: newId("pw") + newId("pw"),
    ageVerified: true,
  });
  const user = res.user;
  if (!user) return json({ error: "Could not create guest session." }, 500);

  const token = createSession(user.id);
  return json({ user: publicUser(user), token, guest: true });
}
