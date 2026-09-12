import { clearSessionCookie, SESSION_COOKIE_NAME } from "@/server/auth";
import { json } from "@/server/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Prefer the Authorization header; fall back to the session cookie.
  let token: string | null = null;
  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    token = auth.slice(7).trim();
  } else {
    token =
      req.headers
        .get("cookie")
        ?.split(";")
        .find((c) => c.trim().startsWith(SESSION_COOKIE_NAME + "="))
        ?.split("=")[1] || null;
  }
  if (token) {
    const { destroySession } = await import("@/server/auth");
    destroySession(token.trim());
  }
  const res = json({ ok: true });
  return clearSessionCookie(res);
}
