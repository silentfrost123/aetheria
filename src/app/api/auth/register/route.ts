import { NextResponse } from "next/server";
import { createUser, createSession, setSessionCookie, publicUser } from "@/server/auth";
import { json, error, readBody } from "@/server/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
