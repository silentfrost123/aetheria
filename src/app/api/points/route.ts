import { json, requireUser } from "@/server/http";
import {
  getBalance,
  canClaimDaily,
  getStreak,
  streakBonus,
  listTransactions,
  DAILY_POINTS,
  MESSAGE_COST,
} from "@/server/services/points";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  return json({
    balance: getBalance(user.id),
    canClaim: canClaimDaily(user.id),
    streak: getStreak(user.id),
    nextStreakBonus: streakBonus(getStreak(user.id) + 1),
    transactions: listTransactions(user.id, 30),
    config: {
      dailyPoints: DAILY_POINTS,
      messageCost: MESSAGE_COST,
    },
  });
}
