import { json, requireAdmin } from "@/server/http";
import { insertShowcaseCharacters } from "@/server/data/showcase";

export const runtime = "nodejs";

/** Admin-only: install the showcase character pack (idempotent). */
export async function POST(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return json({ error: "Admins only." }, 403);
  try {
    const result = insertShowcaseCharacters();
    return json(result);
  } catch (e: any) {
    return json({ error: e?.message || "Couldn't install the showcase pack." }, 500);
  }
}
