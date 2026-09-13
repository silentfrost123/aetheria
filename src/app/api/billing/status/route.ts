import { json, requireUser } from "@/server/http";
import { getSubscription, planFeaturesFor } from "@/server/services/billing";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  return json({
    plan: user.plan,
    features: planFeaturesFor(user.plan),
    subscription: getSubscription(user.id),
  });
}
