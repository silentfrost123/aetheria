import { json, requireUser } from "@/server/http";
import { claimDaily, getBalance, addPoints } from "@/server/services/points";
import { dailyPlanBonus } from "@/server/services/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const result = claimDaily(user.id);

  // Premium plans earn an extra daily bonus (server-side entitlement).
  let planBonus = 0;
  if (result.claimed) {
    planBonus = dailyPlanBonus(user.plan);
    if (planBonus > 0) {
      addPoints(user.id, planBonus, "daily", `${String(user.plan).toUpperCase()} daily bonus`);
    }
  }

  return json({ ...result, planBonus, balance: getBalance(user.id) });
}
