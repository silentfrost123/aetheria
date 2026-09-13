import { json, requireUser, readBody } from "@/server/http";
import { createCheckout, BillingError } from "@/server/services/billing";

export const runtime = "nodejs";

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
    const baseUrl = new URL(req.url).origin;
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
