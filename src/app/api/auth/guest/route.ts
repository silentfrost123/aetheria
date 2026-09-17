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
  const email = `guest_${stamp}@guest.chatworld.dev`;

  // Generate a username that is very unlikely to collide; the createUser path
  // also guards against a collision (returns a friendly error rather than 500),
  // so on the rare collision we retry with a fresh name.
  let res: { user: any; error?: string } = { user: null };
  for (let attempt = 0; attempt < 3; attempt++) {
    const suffix = crypto.randomBytes(6).toString("hex");
    const username = `Guest${suffix}`;
    res = createUser({
      email,
      username,
      password: newId("pw") + newId("pw"),
      ageVerified: true,
    });
    if (res.user || !res.error) break;
  }
  const user = res.user;
  if (!user) return json({ error: "Could not create guest session." }, 500);

  const token = createSession(user.id);
  return json({ user: publicUser(user), token, guest: true });
}
