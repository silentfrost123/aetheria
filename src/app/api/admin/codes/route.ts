import { json, requireAdmin, readBody } from "@/server/http";
import { adminCreateCode } from "@/server/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return json({ error: "Forbidden." }, 403);
  const body = await readBody<{ amount: number; count: number }>(req);
  const amount = Math.floor(Number(body.amount));
  const count = Math.floor(Number(body.count) || 1);
  if (!Number.isInteger(amount) || amount <= 0) {
    return json({ error: "Amount must be a positive integer." }, 400);
  }
  const codes = adminCreateCode(admin.id, amount, count);
  return json({ ok: true, codes, amount });
}
