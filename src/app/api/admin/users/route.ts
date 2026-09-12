import { json, requireAdmin } from "@/server/http";
import { listUsers } from "@/server/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return json({ error: "Forbidden." }, 403);
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  return json({ users: listUsers(q) });
}
