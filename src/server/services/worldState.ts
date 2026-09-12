import { db, nowIso } from "../db";
import { newId, safeParse } from "../util";
import type { WorldState } from "@/lib/types";

function mapState(row: any): WorldState {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    worldId: row.world_id,
    date: row.date,
    timeOfDay: row.time_of_day,
    season: row.season,
    weather: row.weather,
    currentLocation: row.current_location,
    npcLocations: safeParse(row.npc_locations, {}),
    mutable: safeParse(row.mutable, {}),
    updatedAt: row.updated_at,
  };
}

export function getWorldState(conversationId: string): WorldState | null {
  const row = db
    .prepare("SELECT * FROM world_state WHERE conversation_id = ?")
    .get(conversationId) as any;
  return row ? mapState(row) : null;
}

export function ensureWorldState(
  conversationId: string,
  worldId?: string | null,
  initial?: Partial<WorldState>
): WorldState {
  const existing = getWorldState(conversationId);
  if (existing) return existing;
  const id = newId("wst");
  const s = {
    date: initial?.date || "Day 1",
    timeOfDay: initial?.timeOfDay || "morning",
    season: initial?.season || "spring",
    weather: initial?.weather || "clear",
    currentLocation: initial?.currentLocation || "",
    npcLocations: initial?.npcLocations || {},
    mutable: initial?.mutable || {},
  };
  db.prepare(
    `INSERT INTO world_state (id, conversation_id, world_id, date, time_of_day, season, weather,
      current_location, npc_locations, mutable, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    conversationId,
    worldId || null,
    s.date,
    s.timeOfDay,
    s.season,
    s.weather,
    s.currentLocation,
    JSON.stringify(s.npcLocations),
    JSON.stringify(s.mutable),
    nowIso()
  );
  return getWorldState(conversationId)!;
}

export function updateWorldState(
  conversationId: string,
  patch: Partial<WorldState>
): WorldState {
  const existing = getWorldState(conversationId);
  if (!existing) return ensureWorldState(conversationId, null, patch);
  const next = { ...existing, ...patch };
  db.prepare(
    `UPDATE world_state SET date=?, time_of_day=?, season=?, weather=?, current_location=?,
      npc_locations=?, mutable=?, updated_at=? WHERE conversation_id=?`
  ).run(
    next.date,
    next.timeOfDay,
    next.season,
    next.weather,
    next.currentLocation,
    JSON.stringify(next.npcLocations),
    JSON.stringify(next.mutable),
    nowIso(),
    conversationId
  );
  return getWorldState(conversationId)!;
}
