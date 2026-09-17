import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { isGoogleConfigured, googleAuthUrl, publicBaseUrl } from "@/server/googleOAuth";
import { json } from "@/server/http";

export const runtime = "nodejs";

const STATE_COOKIE = "chatworld_oauth_state";

/**
 * Start the Google sign-in flow: redirect the browser to Google's consent
 * screen with a random CSRF "state" value stored in an httpOnly cookie so we
 * can validate it on the callback.
 */
export async function GET(req: Request) {
  if (!isGoogleConfigured()) {
    return json({ error: "Google sign-in is not configured." }, 503);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const origin = publicBaseUrl(req);
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  const res = NextResponse.redirect(googleAuthUrl(redirectUri, state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  });
  return res;
}
