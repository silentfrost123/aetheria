import { json, requireUser } from "@/server/http";
import { confirmZiinaPayment, BillingError } from "@/server/services/billing";
import { getBalance } from "@/server/services/points";
import { db } from "@/server/db";

export const runtime = "nodejs";

// After the customer returns from the provider's hosted checkout, the client
// asks the server to verify the payment. Verification is server-to-provider;
// the client only supplies the payment id, which must belong to the caller.
export async function GET(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const paymentId = new URL(req.url).searchParams.get("payment");
  if (!paymentId) return json({ error: "Missing payment id." }, 400);

  const pay = db.prepare("SELECT user_id FROM payments WHERE id = ?").get(paymentId) as any;
  if (!pay || pay.user_id !== user.id) {
    return json({ error: "Unknown payment." }, 404);
  }

  try {
    const result = await confirmZiinaPayment(paymentId);
    return json({ ...result, balance: getBalance(user.id) });
  } catch (e) {
    if (e instanceof BillingError) return json({ error: e.message }, e.status);
    console.error("[billing] confirm failed:", e);
    return json({ error: "Couldn't verify the payment. Try again." }, 500);
  }
}
