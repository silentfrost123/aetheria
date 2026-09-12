import { json, requireUser, readBody } from "@/server/http";
import { redeemCode, getBalance } from "@/server/services/points";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const body = await readBody<{ code: string }>(req);
  const result = redeemCode(user.id, body.code || "");
  return json({ ...result, balance: getBalance(user.id) });
}
