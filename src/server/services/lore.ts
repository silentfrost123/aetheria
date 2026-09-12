import { db } from "../db";
import type { LoreEntry } from "@/lib/types";
import { safeParse } from "../util";

function mapEntry(row: any): LoreEntry {
  return {
    id: row.id,
    worldId: row.world_id,
    characterId: row.character_id,
    name: row.name,
    keywords: safeParse(row.keywords, []),
    aliases: safeParse(row.aliases, []),
    content: row.content,
    priority: row.priority,
    enabled: !!row.enabled,
    alwaysActive: !!row.always_active,
    activationProbability: row.activation_probability,
    createdAt: row.created_at,
  };
}

export function getEntriesForCharacter(characterId: string): LoreEntry[] {
  const rows = db
    .prepare(
      "SELECT * FROM lore_entries WHERE character_id = ? AND enabled = 1"
    )
    .all(characterId);
  return rows.map(mapEntry);
}

export function getEntriesForWorld(worldId: string): LoreEntry[] {
  const rows = db
    .prepare("SELECT * FROM lore_entries WHERE world_id = ? AND enabled = 1")
    .all(worldId);
  return rows.map(mapEntry);
}

export function getAllEntriesForCharacter(characterId: string): LoreEntry[] {
  const rows = db
    .prepare("SELECT * FROM lore_entries WHERE character_id = ?")
    .all(characterId);
  return rows.map(mapEntry);
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Two-layer lore retrieval:
 *  Layer 1 — keyword/alias exact & substring matching.
 *  Layer 2 — lexical similarity (a lightweight stand-in for embeddings; swap in
 *            vector search via embedTexts() when an embedding provider exists).
 *
 * Returns entries ranked by a combined score that folds in priority and the
 * configured activation probability.
 */
export function retrieveLore(
  entries: LoreEntry[],
  userText: string,
  historyText: string,
  opts: { maxEntries?: number; keywordWeight?: number } = {}
): LoreEntry[] {
  const { maxEntries = 6, keywordWeight = 0.6 } = opts;
  const text = (userText + " " + historyText.slice(-2000)).toLowerCase();
  const userTokens = tokenize(userText);
  const contextTokens = tokenize(text);

  const scored: { entry: LoreEntry; score: number }[] = [];

  for (const entry of entries) {
    if (!entry.enabled) continue;
    const terms = [entry.name, ...entry.keywords, ...entry.aliases];

    // Layer 1: keyword
    let keywordHit = 0;
    for (const term of terms) {
      const t = term.toLowerCase();
      if (!t) continue;
      if (text.includes(t)) keywordHit = Math.max(keywordHit, 1);
      // exact token match is stronger
      if (userTokens.has(t) || (t.split(/\s+/).length > 1 && text.includes(t))) {
        keywordHit = Math.max(keywordHit, 1.5);
      }
    }

    // Layer 2: lexical similarity over tokens
    let semantic = 0;
    for (const term of terms) {
      const t = tokenize(term);
      if (t.size) semantic = Math.max(semantic, jaccard(t, contextTokens));
    }

    let score = 0;
    if (entry.alwaysActive) {
      score = 2 + entry.priority / 10;
    } else if (keywordHit > 0) {
      score = keywordHit * keywordWeight + semantic * 0.4;
    } else {
      score = semantic;
    }

    // Apply activation probability as a soft gate (always-active bypasses).
    if (!entry.alwaysActive && Math.random() > entry.activationProbability) {
      score *= 0.3;
    }

    if (score > 0.05) {
      scored.push({ entry, score: score + entry.priority / 100 });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxEntries).map((s) => s.entry);
}
