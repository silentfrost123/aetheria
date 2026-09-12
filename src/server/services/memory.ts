import { db, nowIso } from "../db";
import { newId, safeParse, agoLabel } from "../util";
import type { Memory } from "@/lib/types";
import { retrieveLore } from "./lore";

function mapMemory(row: any): Memory {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    characterId: row.character_id,
    userId: row.user_id,
    type: row.type,
    importance: row.importance,
    content: row.content,
    participants: safeParse(row.participants, []),
    location: row.location,
    emotionalImpact: row.emotional_impact,
    isPinned: !!row.is_pinned,
    isImportant: !!row.is_important,
    source: row.source,
    createdAt: row.created_at,
  };
}

export function listMemories(
  conversationId: string,
  opts: { pinnedFirst?: boolean } = {}
): Memory[] {
  let rows = db
    .prepare(
      "SELECT * FROM memories WHERE conversation_id = ? ORDER BY created_at DESC"
    )
    .all(conversationId) as any[];
  const mapped = rows.map(mapMemory);
  if (opts.pinnedFirst) {
    mapped.sort((a, b) => {
      const pa = a.isPinned ? 1 : 0;
      const pb = b.isPinned ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return b.importance - a.importance;
    });
  }
  return mapped;
}

export function addMemory(input: {
  conversationId: string;
  characterId?: string | null;
  userId: string;
  type: string;
  importance: number;
  content: string;
  participants?: string[];
  location?: string;
  emotionalImpact?: string;
  source?: "auto" | "manual" | "summary";
  isImportant?: boolean;
}): Memory {
  const id = newId("mem");
  db.prepare(
    `INSERT INTO memories
      (id, conversation_id, character_id, user_id, type, importance, content,
       participants, location, emotional_impact, is_pinned, is_important, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
  ).run(
    id,
    input.conversationId,
    input.characterId || null,
    input.userId,
    input.type,
    input.importance,
    input.content,
    JSON.stringify(input.participants || []),
    input.location || null,
    input.emotionalImpact || null,
    input.isImportant ? 1 : 0,
    input.source || "auto",
    nowIso()
  );
  return mapMemory(
    db.prepare("SELECT * FROM memories WHERE id = ?").get(id) as any
  );
}

export function updateMemory(
  id: string,
  patch: Partial<Pick<Memory, "content" | "importance" | "isPinned" | "isImportant">>
): void {
  const sets: string[] = [];
  const vals: any[] = [];
  if (patch.content !== undefined) {
    sets.push("content = ?");
    vals.push(patch.content);
  }
  if (patch.importance !== undefined) {
    sets.push("importance = ?");
    vals.push(patch.importance);
  }
  if (patch.isPinned !== undefined) {
    sets.push("is_pinned = ?");
    vals.push(patch.isPinned ? 1 : 0);
  }
  if (patch.isImportant !== undefined) {
    sets.push("is_important = ?");
    vals.push(patch.isImportant ? 1 : 0);
  }
  if (!sets.length) return;
  vals.push(id);
  db.prepare(`UPDATE memories SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
}

export function deleteMemory(id: string): void {
  db.prepare("DELETE FROM memories WHERE id = ?").run(id);
}

/**
 * Retrieve relevant long-term memories using the retrieval formula:
 *   score = semantic * 0.45 + importance * 0.25 + recency * 0.15 + keyword * 0.15
 * (Here "semantic" is approximated lexically; swap in embeddings later.)
 */
export function retrieveMemories(
  conversationId: string,
  userText: string,
  opts: { maxEntries?: number } = {}
): Memory[] {
  const { maxEntries = 8 } = opts;
  const memories = listMemories(conversationId);
  if (!memories.length) return [];

  const text = userText.toLowerCase();
  const userTokens = new Set(
    text.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 2)
  );

  const now = Date.now();
  const scored = memories.map((m) => {
    const mTokens = new Set(
      m.content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2)
    );

    // lexical similarity
    let inter = 0;
    for (const t of userTokens) if (mTokens.has(t)) inter++;
    const semantic = userTokens.size
      ? inter / (userTokens.size + mTokens.size - inter || 1)
      : 0;

    const importance = m.importance;
    const ageDays = (now - new Date(m.createdAt).getTime()) / 86400000;
    const recency = Math.max(0, 1 - ageDays / 30);

    let keyword = 0;
    for (const p of m.participants) {
      if (p && text.includes(p.toLowerCase())) keyword = Math.max(keyword, 1);
    }
    if (m.location && text.includes(m.location.toLowerCase())) {
      keyword = Math.max(keyword, 1);
    }

    let score =
      semantic * 0.45 + importance * 0.25 + recency * 0.15 + keyword * 0.15;
    if (m.isPinned) score += 0.5;
    if (m.isImportant) score += 0.2;

    return { m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, maxEntries)
    .filter((s) => s.score > 0.08)
    .map((s) => s.m);
}

export { agoLabel };
