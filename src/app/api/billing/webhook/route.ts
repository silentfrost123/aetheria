import { json } from "@/server/http";
import { handleWebhook, BillingError } from "@/server/services/billing";

export const runtime = "nodejs";

// Stripe signs the raw body; we must verify that signature and fulfil the
// purchase server-side. The client is never trusted for payment confirmation.
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");
  try {
    await handleWebhook(raw, signature);
    return json({ received: true });
  } catch (e) {
    if (e instanceof BillingError) return json({ error: e.message }, e.status);
    console.error("[billing] webhook failed:", e);
    return json({ error: "Webhook processing failed." }, 500);
  }
}
