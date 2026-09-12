import { json, requireUser, readBody, error } from "@/server/http";
import { listWorlds, createWorld } from "@/server/services/world";
import { getEntriesForWorld } from "@/server/services/lore";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const worlds = listWorlds({
    query: url.searchParams.get("q") || undefined,
    genre: url.searchParams.get("genre") || undefined,
    creatorId: url.searchParams.get("creator") || undefined,
  });
  return json({ worlds });
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);
  if (!body.name?.trim()) return error("Name is required.");
  const world = createWorld(user.id, body);
  return json({ world });
}
