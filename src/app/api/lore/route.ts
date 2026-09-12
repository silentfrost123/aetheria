import { json, requireUser, readBody, error } from "@/server/http";
import { db, nowIso } from "@/server/db";
import { newId } from "@/server/util";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const worldId = url.searchParams.get("worldId");
  const characterId = url.searchParams.get("characterId");
  if (!worldId && !characterId) return json({ entries: [] });
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
