import { json, requireUser, readBody, error } from "@/server/http";
import { db, nowIso } from "@/server/db";
import { newId } from "@/server/util";

export const runtime = "nodejs";

/**
 * Ownership helper: returns true if the user owns the world and/or character
 * that a lore entry is (being) attached to. Lore can only be managed by the
 * owner of the entity it belongs to.
 */
function ownsTarget(
  userId: string,
  worldId: string | null | undefined,
  characterId: string | null | undefined
): boolean {
  if (worldId) {
    const w = db.prepare("SELECT creator_id FROM worlds WHERE id = ?").get(worldId) as any;
    if (!w || w.creator_id !== userId) return false;
  }
  if (characterId) {
    const c = db.prepare("SELECT creator_id FROM characters WHERE id = ?").get(characterId) as any;
    if (!c || c.creator_id !== userId) return false;
  }
  // Require at least one target; entries must be attached to owned content.
  return !!(worldId || characterId);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const worldId = url.searchParams.get("worldId");
  const characterId = url.searchParams.get("characterId");
  if (!worldId && !characterId) return json({ entries: [] });

  // Lore attached to a *private* entity is only visible to its owner.
  const user = requireUser(req);
  if (worldId) {
    const w = db.prepare("SELECT is_public, creator_id FROM worlds WHERE id = ?").get(worldId) as any;
    if (w && !w.is_public && w.creator_id !== user?.id) return json({ entries: [] });
  }
  if (characterId) {
    const c = db.prepare("SELECT is_public, creator_id FROM characters WHERE id = ?").get(characterId) as any;
    if (c && !c.is_public && c.creator_id !== user?.id) return json({ entries: [] });
  }

  const rows = db
    .prepare(
      "SELECT * FROM lore_entries WHERE (world_id = ? OR character_id = ?) ORDER BY priority DESC"
    )
    .all(worldId || null, characterId || null) as any[];
  return json({ entries: rows.map(mapLore) });
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);
  if (!body.name?.trim() || !body.content?.trim()) {
    return error("name and content are required.");
  }
  if (!ownsTarget(user.id, body.worldId, body.characterId)) {
    return error("You can only add lore to your own worlds and characters.", 403);
  }
  const id = newId("lor");
  db.prepare(
    `INSERT INTO lore_entries (id, world_id, character_id, name, keywords, aliases, content, priority, enabled, always_active, activation_probability, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
  ).run(
    id,
    body.worldId || null,
    body.characterId || null,
    body.name,
    JSON.stringify(body.keywords || []),
    JSON.stringify(body.aliases || []),
    body.content,
    body.priority ?? 5,
    body.alwaysActive ? 1 : 0,
    body.activationProbability ?? 0.75,
    nowIso()
  );
  return json({ entry: mapLore(db.prepare("SELECT * FROM lore_entries WHERE id = ?").get(id)) });
}

export async function DELETE(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return error("id required.");

  const entry = db.prepare("SELECT * FROM lore_entries WHERE id = ?").get(id) as any;
  if (!entry) return error("Not found.", 404);
  if (!ownsTarget(user.id, entry.world_id, entry.character_id)) {
    return error("You can only delete lore from your own worlds and characters.", 403);
  }
  db.prepare("DELETE FROM lore_entries WHERE id = ?").run(id);
  return json({ ok: true });
}

function mapLore(row: any) {
  return {
    id: row.id,
    worldId: row.world_id,
    characterId: row.character_id,
    name: row.name,
    keywords: JSON.parse(row.keywords || "[]"),
    aliases: JSON.parse(row.aliases || "[]"),
    content: row.content,
    priority: row.priority,
    enabled: !!row.enabled,
    alwaysActive: !!row.always_active,
    activationProbability: row.activation_probability,
    createdAt: row.created_at,
  };
}
