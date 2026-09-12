import { json } from "@/server/http";
import { newId } from "@/server/util";
import {
  getUserByEmail,
  createUser,
  createSession,
  publicUser,
} from "@/server/auth";

export const runtime = "nodejs";

const GUEST_EMAIL = "guest@aetheria.dev";

/**
 * Auto-provisions a guest session so the app is usable with zero friction,
 * even in embedded/preview environments where cookies and localStorage are
 * blocked. Returns a token the client can hold in memory.
 */
export async function POST(_req: Request) {
  let user = getUserByEmail(GUEST_EMAIL);
  if (!user) {
    const res = createUser({
      email: GUEST_EMAIL,
      username: "Guest",
      password: newId("pw") + newId("pw"),
      ageVerified: true,
    });
    user = res.user;
  }
  if (!user) return json({ error: "Could not create guest session." }, 500);

  const token = createSession(user.id);
  return json({ user: publicUser(user), token, guest: true });
}
