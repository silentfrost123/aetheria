import { json, requireUser, readBody, error, validImageField } from "@/server/http";
import { listWorlds, createWorld } from "@/server/services/world";
import { getEntriesForWorld } from "@/server/services/lore";
import { listCharacters, getCreatorUsername } from "@/server/services/character";
import { db } from "@/server/db";

export const runtime = "nodejs";

function characterCountForWorld(worldId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM characters WHERE world_id = ?")
    .get(worldId) as any;
  return row?.n ?? 0;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const worlds = listWorlds({
    query: url.searchParams.get("q") || undefined,
    genre: url.searchParams.get("genre") || undefined,
    creatorId: url.searchParams.get("creator") || undefined,
  });
  return json({
    worlds: worlds.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      genre: w.genre,
      artwork: w.artwork,
      creator: { id: w.creatorId, username: getCreatorUsername(w.creatorId) },
      characterCount: characterCountForWorld(w.id),
      createdAt: w.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);
  if (!body.name?.trim()) return error("Name is required.");
  if (!validImageField(body.artwork)) return error("Invalid image data.", 400);
  const world = createWorld(user.id, body);
  return json({ world });
}
