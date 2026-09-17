import { json, requireUser, readBody } from "@/server/http";
import { createCheckout, BillingError } from "@/server/services/billing";

export const runtime = "nodejs";

/**
 * The user-facing origin for payment return URLs. Behind proxies (Railway,
 * preview hosts) req.url is the server's bind address — honor forwarded
 * headers instead, with an APP_URL override for unusual setups.
 */
function publicOrigin(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const h = req.headers;
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host");
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const body = await readBody<{ kind?: string; refId?: string }>(req);
  if (body.kind !== "credits" && body.kind !== "subscription") {
    return json({ error: "Invalid checkout kind." }, 400);
  }
  if (!body.refId || typeof body.refId !== "string") {
    return json({ error: "Missing item." }, 400);
  }

  try {
    const baseUrl = publicOrigin(req);
    const { url } = await createCheckout(
      user.id,
      { kind: body.kind, refId: body.refId },
      baseUrl
    );
    return json({ url });
  } catch (e) {
    if (e instanceof BillingError) return json({ error: e.message }, e.status);
    console.error("[billing] checkout failed:", e);
    return json({ error: "Couldn't start checkout. Try again." }, 500);
  }
}
