import { db, nowIso } from "../db";
import { newId, safeParse } from "../util";
import type { World } from "@/lib/types";

function mapWorld(row: any): World {
  return {
    id: row.id,
    creatorId: row.creator_id,
    name: row.name,
    description: row.description,
    genre: row.genre,
    artwork: row.artwork,
    timeline: row.timeline,
    locations: safeParse(row.locations, []),
    factions: safeParse(row.factions, []),
    characters: safeParse(row.characters, []),
    creatures: safeParse(row.creatures, []),
    items: safeParse(row.items, []),
    magicSystem: row.magic_system,
    technology: row.technology,
    politics: row.politics,
    history: row.history,
    rules: row.rules,
    events: safeParse(row.events, []),
    customLore: safeParse(row.custom_lore, []),
    isPublic: !!row.is_public,
    createdAt: row.created_at,
  };
}

export function getWorld(id: string): World | null {
  const row = db.prepare("SELECT * FROM worlds WHERE id = ?").get(id) as any;
  return row ? mapWorld(row) : null;
}

export function listWorlds(opts: { query?: string; genre?: string; creatorId?: string } = {}): World[] {
  const clauses: string[] = ["is_public = 1"];
  const params: any[] = [];
  if (opts.query) {
    clauses.push("(lower(name) LIKE ? OR lower(description) LIKE ?)");
    const q = `%${opts.query.toLowerCase()}%`;
    params.push(q, q);
  }
  if (opts.genre) {
    clauses.push("lower(genre) = lower(?)");
    params.push(opts.genre);
  }
  if (opts.creatorId) {
    clauses[0] = "1=1";
    clauses.push("creator_id = ?");
    params.push(opts.creatorId);
  }
  const rows = db
    .prepare(`SELECT * FROM worlds WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT 100`)
    .all(...params) as any[];
  return rows.map(mapWorld);
}

export function createWorld(creatorId: string, input: Partial<World>): World {
  const id = newId("wrl");
  db.prepare(
    `INSERT INTO worlds (id, creator_id, name, description, genre, artwork, timeline, locations, factions,
      characters, creatures, items, magic_system, technology, politics, history, rules, events, custom_lore, is_public, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    creatorId,
    input.name || "Untitled World",
    input.description || "",
    input.genre || "",
    input.artwork || null,
    input.timeline || null,
    JSON.stringify(input.locations || []),
    JSON.stringify(input.factions || []),
    JSON.stringify(input.characters || []),
    JSON.stringify(input.creatures || []),
    JSON.stringify(input.items || []),
    input.magicSystem || null,
    input.technology || null,
    input.politics || null,
    input.history || null,
    input.rules || null,
    JSON.stringify(input.events || []),
    JSON.stringify(input.customLore || []),
    input.isPublic ? 1 : 0,
    nowIso()
  );
  return getWorld(id)!;
}

export function updateWorld(id: string, creatorId: string, patch: Partial<World>): World | null {
  const existing = getWorld(id);
  if (!existing || existing.creatorId !== creatorId) return null;
  const next = { ...existing, ...patch };
  db.prepare(
    `UPDATE worlds SET name=?, description=?, genre=?, artwork=?, timeline=?, locations=?, factions=?,
      characters=?, creatures=?, items=?, magic_system=?, technology=?, politics=?, history=?, rules=?,
      events=?, custom_lore=?, is_public=? WHERE id=?`
  ).run(
    next.name,
    next.description,
    next.genre,
    next.artwork,
    next.timeline,
    JSON.stringify(next.locations),
    JSON.stringify(next.factions),
    JSON.stringify(next.characters),
    JSON.stringify(next.creatures),
    JSON.stringify(next.items),
    next.magicSystem,
    next.technology,
    next.politics,
    next.history,
    next.rules,
    JSON.stringify(next.events),
    JSON.stringify(next.customLore),
    next.isPublic ? 1 : 0,
    id
  );
  return getWorld(id);
}
