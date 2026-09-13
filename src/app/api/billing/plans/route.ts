import { json, requireUser } from "@/server/http";
import {
  listPlans,
  listPackages,
  paymentsConfigured,
  activeProvider,
  getSubscription,
  planFeaturesFor,
} from "@/server/services/billing";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = requireUser(req);
  return json({
    configured: paymentsConfigured(),
    provider: activeProvider(),
    plans: listPlans(),
    packages: listPackages(),
    subscription: user ? getSubscription(user.id) : null,
    features: user ? planFeaturesFor(user.plan) : planFeaturesFor("free"),
  });
}
