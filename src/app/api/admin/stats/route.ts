import { json, requireAdmin } from "@/server/http";
import { getStats, listRecentAudit } from "@/server/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return json({ error: "Forbidden." }, 403);
  return json({ stats: getStats(), audit: listRecentAudit(50) });
}
