import { db, nowIso } from "../db";
import { newId, safeParse } from "../util";
import type { Character } from "@/lib/types";

function mapCharacter(row: any): Character {
  return {
    id: row.id,
    creatorId: row.creator_id,
    name: row.name,
    avatar: row.avatar,
    banner: row.banner,
    age: row.age,
    gender: row.gender,
    species: row.species,
    occupation: row.occupation,
    tags: safeParse(row.tags, []),
    shortDescription: row.short_description,
    publicDescription: row.public_description,
    greetings: safeParse(row.greetings, []),
    isPublic: !!row.is_public,
    allowRemix: !!row.allow_remix,
    visibility: row.visibility,
    definition: safeParse(row.definition, {} as Character["definition"]),
    personality: safeParse(row.personality, {} as Character["personality"]),
    worldId: row.world_id,
    scenarioId: row.scenario_id,
    remixedFrom: row.remixed_from,
    stats: safeParse(row.stats, {} as Character["stats"]),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getCharacter(id: string): Character | null {
  const row = db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as any;
  return row ? mapCharacter(row) : null;
}

export interface CharacterListFilter {
  query?: string;
  genre?: string;
  gender?: string;
  sort?: "popular" | "recent" | "trending";
  creatorId?: string;
  includePrivate?: boolean;
}

export function listCharacters(filter: CharacterListFilter = {}): Character[] {
  const clauses: string[] = [];
  const params: any[] = [];

  if (!filter.includePrivate) {
    clauses.push("is_public = 1");
  }
  if (filter.creatorId) {
    clauses.push("creator_id = ?");
    params.push(filter.creatorId);
  }
  if (filter.genre) {
    clauses.push("tags LIKE ?");
    params.push(`%${filter.genre}%`);
  }
  if (filter.gender) {
    clauses.push("lower(gender) = lower(?)");
    params.push(filter.gender);
  }
  if (filter.query) {
    clauses.push(
      "(lower(name) LIKE ? OR lower(short_description) LIKE ? OR lower(tags) LIKE ?)"
    );
    const q = `%${filter.query.toLowerCase()}%`;
    params.push(q, q, q);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  let order = "ORDER BY created_at DESC";
  if (filter.sort === "popular") {
    order = "ORDER BY CAST(json_extract(stats, '$.chats') AS INTEGER) DESC";
  } else if (filter.sort === "recent") {
    order = "ORDER BY created_at DESC";
  } else if (filter.sort === "trending") {
    order = "ORDER BY (CAST(json_extract(stats, '$.chats') AS INTEGER) + CAST(json_extract(stats, '$.likes') AS INTEGER)) DESC";
  }

  const rows = db
    .prepare(`SELECT * FROM characters ${where} ${order} LIMIT 200`)
    .all(...params) as any[];
  return rows.map(mapCharacter);
}

export interface CharacterInput {
  name: string;
  avatar?: string;
  banner?: string;
  age?: string;
  gender?: string;
  species?: string;
  occupation?: string;
  tags: string[];
  shortDescription: string;
  publicDescription: string;
  greetings: string[];
  definition?: Partial<Character["definition"]>;
  personality?: Partial<Character["personality"]>;
  worldId?: string | null;
  scenarioId?: string | null;
  isPublic?: boolean;
  allowRemix?: boolean;
}

export function createCharacter(creatorId: string, input: CharacterInput): Character {
  const id = newId("chr");
  db.prepare(
    `INSERT INTO characters (id, creator_id, name, avatar, banner, age, gender, species, occupation,
      tags, short_description, public_description, greetings, is_public, allow_remix, visibility,
      definition, personality, world_id, scenario_id, stats, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'private', ?, ?, ?, ?, '{"chats":0,"likes":0,"favorites":0}', ?, ?)`
  ).run(
    id,
    creatorId,
    input.name,
    input.avatar || null,
    input.banner || null,
    input.age || null,
    input.gender || null,
    input.species || null,
    input.occupation || null,
    JSON.stringify(input.tags || []),
    input.shortDescription || "",
    input.publicDescription || "",
    JSON.stringify(input.greetings || []),
    input.isPublic ? 1 : 0,
    input.allowRemix === false ? 0 : 1,
    JSON.stringify(input.definition || {}),
    JSON.stringify(input.personality || {}),
    input.worldId || null,
    input.scenarioId || null,
    nowIso(),
    nowIso()
  );
  return getCharacter(id)!;
}

export function updateCharacter(
  id: string,
  creatorId: string,
  patch: Partial<CharacterInput>
): Character | null {
  const existing = getCharacter(id);
  if (!existing || existing.creatorId !== creatorId) return null;

  const sets: string[] = [];
  const vals: any[] = [];
  const map: Record<string, string> = {
    name: "name",
    avatar: "avatar",
    banner: "banner",
    age: "age",
    gender: "gender",
    species: "species",
    occupation: "occupation",
    shortDescription: "short_description",
    publicDescription: "public_description",
    worldId: "world_id",
    scenarioId: "scenario_id",
  };
  for (const [k, col] of Object.entries(map)) {
    if ((patch as any)[k] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push((patch as any)[k]);
    }
  }
  if (patch.tags !== undefined) {
    sets.push("tags = ?");
    vals.push(JSON.stringify(patch.tags));
  }
  if (patch.greetings !== undefined) {
    sets.push("greetings = ?");
    vals.push(JSON.stringify(patch.greetings));
  }
  if (patch.definition !== undefined) {
    sets.push("definition = ?");
    vals.push(JSON.stringify(patch.definition));
  }
  if (patch.personality !== undefined) {
    sets.push("personality = ?");
    vals.push(JSON.stringify(patch.personality));
  }
  if (patch.isPublic !== undefined) {
    sets.push("is_public = ?");
    vals.push(patch.isPublic ? 1 : 0);
  }
  if (patch.allowRemix !== undefined) {
    sets.push("allow_remix = ?");
    vals.push(patch.allowRemix ? 1 : 0);
  }
  sets.push("updated_at = ?");
  vals.push(nowIso());
  vals.push(id);

  db.prepare(`UPDATE characters SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return getCharacter(id);
}

export function deleteCharacter(id: string, creatorId: string): boolean {
  const existing = getCharacter(id);
  if (!existing || existing.creatorId !== creatorId) return false;
  db.prepare("DELETE FROM characters WHERE id = ?").run(id);
  return true;
}

export function remixCharacter(id: string, creatorId: string): Character | null {
  const source = getCharacter(id);
  if (!source || !source.isPublic) return null;
  if (!source.allowRemix && source.creatorId !== creatorId) return null;

  const copy = createCharacter(creatorId, {
    name: `${source.name} (Remix)`,
    avatar: source.avatar,
    banner: source.banner,
    age: source.age,
    gender: source.gender,
    species: source.species,
    occupation: source.occupation,
    tags: source.tags,
    shortDescription: source.shortDescription,
    publicDescription: source.publicDescription,
    greetings: source.greetings,
    definition: source.definition,
    personality: source.personality,
    worldId: source.worldId,
    scenarioId: source.scenarioId,
    isPublic: false,
  });
  db.prepare("UPDATE characters SET remixed_from = ? WHERE id = ?").run(id, copy.id);
  return copy;
}

export function getCreatorUsername(creatorId: string): string {
  const row = db.prepare("SELECT username FROM users WHERE id = ?").get(creatorId) as any;
  return row?.username || "Unknown";
}
