import { json, error, requireAdmin, readBody } from "@/server/http";
import { isNsfwEnabled, setNsfwEnabled } from "@/server/settings";

export const dynamic = "force-dynamic";

// Admin-only: read the site-wide adult-content master switch.
export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return error("Admin only.", 403);
  return json({ enabled: isNsfwEnabled() });
}

// Admin-only: enable / disable adult mode (sexual content).
export async function PUT(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return error("Admin only.", 403);
  const body = await readBody<{ enabled?: unknown }>(req);
  if (typeof body.enabled !== "boolean")
    return error("`enabled` must be a boolean.");
  setNsfwEnabled(body.enabled);
  return json({ enabled: body.enabled });
}
