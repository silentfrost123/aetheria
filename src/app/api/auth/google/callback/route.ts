import { NextResponse } from "next/server";
import {
  exchangeCode,
  fetchGoogleUser,
  publicBaseUrl,
} from "@/server/googleOAuth";
import {
  findOrCreateGoogleUser,
  createSession,
  setSessionCookie,
  readCookie,
} from "@/server/auth";

export const runtime = "nodejs";

const STATE_COOKIE = "aetheria_oauth_state";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const googleError = url.searchParams.get("error");

  // Use the *public* origin (from env), never req.url's origin, which is
  // http://localhost behind Railway's proxy and would bounce the user there.
  const origin = publicBaseUrl(req);
  const base = `${origin}/auth`;

  const fail = (error: string) =>
    NextResponse.redirect(`${base}?error=${encodeURIComponent(error)}`);

  // User declined the consent screen.
  if (googleError) {
    return fail(googleError === "access_denied" ? "Google sign-in was cancelled." : "Google sign-in failed.");
  }

  // CSRF + integrity checks: code and state must be present, and the state must
  // match the value we set when we started the flow (stored in an httpOnly
  // cookie the attacker cannot read or forge cross-origin).
  const expectedState = readCookie(req, STATE_COOKIE);
  if (!code || !state || !expectedState || state !== expectedState) {
    return fail("Sign-in session expired or invalid. Please try again.");
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  try {
    const tokens = await exchangeCode(code, redirectUri);
    const guser = await fetchGoogleUser(tokens.access_token);

    if (!guser.email_verified || !guser.email) {
      return fail("Could not verify your Google email.");
    }

    const user = findOrCreateGoogleUser({
      email: guser.email,
      name: guser.name,
      avatar: guser.picture,
    });
    if (!user) {
      return fail("Could not create your account.");
    }
    if (user.banned) {
      return fail("This account has been suspended.");
    }

    const token = createSession(user.id);
    const res = NextResponse.redirect(origin + "/");
    setSessionCookie(res, token);
    res.cookies.set(STATE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("[google] callback error:", e);
    return fail("Google sign-in failed. Please try again.");
  }
}
