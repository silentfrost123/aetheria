import { json, requireUser } from "@/server/http";
import { claimDaily, getBalance } from "@/server/services/points";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const result = claimDaily(user.id);
  return json({ ...result, balance: getBalance(user.id) });
}
