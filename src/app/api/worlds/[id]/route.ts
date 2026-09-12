import { json, requireUser, readBody, error } from "@/server/http";
import { getWorld, updateWorld } from "@/server/services/world";
import { getEntriesForWorld } from "@/server/services/lore";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const world = getWorld(params.id);
  if (!world) return error("World not found.", 404);
  return json({ world, lore: getEntriesForWorld(world.id) });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);
  const world = updateWorld(params.id, user.id, body);
  if (!world) return error("Not found or not yours.", 404);
  return json({ world });
}
