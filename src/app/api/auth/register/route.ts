import { NextResponse } from "next/server";
import { createUser, createSession, setSessionCookie, publicUser } from "@/server/auth";
import { json, error, readBody } from "@/server/http";
import { rateLimit, clientIp } from "@/server/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`register:ip:${ip}`, 10, 60 * 60_000);
  if (!rl.ok) {
    return json({ error: "Too many registrations. Try again later." }, 429);
  }

  const body = await readBody<{
    email: string;
    username: string;
    password: string;
    ageVerified?: boolean;
  }>(req);

  const { user, error: err } = createUser({
    email: body.email || "",
    username: body.username || "",
    password: body.password || "",
    ageVerified: body.ageVerified,
  });

  if (!user) return error(err || "Could not create account.");

  const token = createSession(user.id);
  const res = json({ user: publicUser(user), token });
  return setSessionCookie(res, token);
}
