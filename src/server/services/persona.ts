import { db, nowIso } from "../db";
import { newId } from "../util";
import type { Persona } from "@/lib/types";

function mapPersona(row: any): Persona {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    age: row.age,
    occupation: row.occupation,
    personality: row.personality,
    appearance: row.appearance,
    background: row.background,
    avatar: row.avatar,
    createdAt: row.created_at,
  };
}

export function listPersonas(userId: string): Persona[] {
  const rows = db
    .prepare("SELECT * FROM personas WHERE user_id = ? ORDER BY created_at ASC")
    .all(userId) as any[];
  return rows.map(mapPersona);
}

export function createPersona(
  userId: string,
  input: Partial<Persona>
): Persona {
  const id = newId("per");
  db.prepare(
    `INSERT INTO personas (id, user_id, name, age, occupation, personality, appearance, background, avatar, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.name || "New Persona",
    input.age || null,
    input.occupation || null,
    input.personality || "",
    input.appearance || "",
    input.background || "",
    input.avatar || null,
    nowIso()
  );
  return mapPersona(db.prepare("SELECT * FROM personas WHERE id = ?").get(id) as any);
}

export function updatePersona(
  id: string,
  userId: string,
  patch: Partial<Persona>
): Persona | null {
  const existing = db.prepare("SELECT * FROM personas WHERE id = ? AND user_id = ?").get(id, userId) as any;
  if (!existing) return null;
  const cur = mapPersona(existing);
  const next = { ...cur, ...patch };
  db.prepare(
    `UPDATE personas SET name=?, age=?, occupation=?, personality=?, appearance=?, background=?, avatar=? WHERE id=?`
  ).run(
    next.name,
    next.age,
    next.occupation,
    next.personality,
    next.appearance,
    next.background,
    next.avatar,
    id
  );
  return mapPersona(db.prepare("SELECT * FROM personas WHERE id = ?").get(id) as any);
}

export function deletePersona(id: string, userId: string): boolean {
  const existing = db.prepare("SELECT * FROM personas WHERE id = ? AND user_id = ?").get(id, userId) as any;
  if (!existing) return false;
  db.prepare("DELETE FROM personas WHERE id = ?").run(id);
  return true;
}
