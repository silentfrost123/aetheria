import { getUserByEmail, verifyPassword, createSession, setSessionCookie, publicUser } from "@/server/auth";
import { json, error, readBody } from "@/server/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await readBody<{ email: string; password: string }>(req);
  const email = (body.email || "").trim().toLowerCase();
  const user = getUserByEmail(email);

  if (!user || !verifyPassword(body.password || "", user.passwordHash)) {
    return error("Invalid email or password.", 401);
  }

  const token = createSession(user.id);
  const res = json({ user: publicUser(user), token });
  return setSessionCookie(res, token);
}
