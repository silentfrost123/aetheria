import { db, nowIso } from "../db";
import { newId, safeParse, clamp } from "../util";
import type { Relationship, RelationshipState } from "@/lib/types";

export const DEFAULT_RELATIONSHIP: RelationshipState = {
  stage: "Acquaintance",
  trust: 50,
  affection: 40,
  respect: 45,
  fear: 0,
  attraction: 0,
  loyalty: 30,
  familiarity: 0,
  suspicion: 0,
};

const STAGES = [
  "Unknown",
  "Acquaintance",
  "Friend",
  "Close Friend",
  "Trusted",
  "Rival",
  "Enemy",
  "Romantic Interest",
  "Partner",
  "Betrayed",
  "Complicated",
];

function mapRel(row: any): Relationship {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    characterId: row.character_id,
    userId: row.user_id,
    stage: row.stage,
    trust: row.trust,
    affection: row.affection,
    respect: row.respect,
    fear: row.fear,
    attraction: row.attraction,
    loyalty: row.loyalty,
    familiarity: row.familiarity,
    suspicion: row.suspicion,
    history: safeParse(row.history, []),
    updatedAt: row.updated_at,
  };
}

export function getRelationship(
  conversationId: string,
  characterId: string
): Relationship | null {
  const row = db
    .prepare(
      "SELECT * FROM relationships WHERE conversation_id = ? AND character_id = ?"
    )
    .get(conversationId, characterId) as any;
  return row ? mapRel(row) : null;
}

export function ensureRelationship(
  conversationId: string,
  characterId: string,
  userId: string
): Relationship {
  const existing = getRelationship(conversationId, characterId);
  if (existing) return existing;
  const id = newId("rel");
  db.prepare(
    `INSERT INTO relationships
      (id, conversation_id, character_id, user_id, stage, trust, affection, respect,
       fear, attraction, loyalty, familiarity, suspicion, history, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?)`
  ).run(
    id,
    conversationId,
    characterId,
    userId,
    DEFAULT_RELATIONSHIP.stage,
    DEFAULT_RELATIONSHIP.trust,
    DEFAULT_RELATIONSHIP.affection,
    DEFAULT_RELATIONSHIP.respect,
    DEFAULT_RELATIONSHIP.fear,
    DEFAULT_RELATIONSHIP.attraction,
    DEFAULT_RELATIONSHIP.loyalty,
    DEFAULT_RELATIONSHIP.familiarity,
    DEFAULT_RELATIONSHIP.suspicion,
    nowIso()
  );
  return getRelationship(conversationId, characterId)!;
}

export function applyRelationshipDelta(
  conversationId: string,
  characterId: string,
  userId: string,
  delta: Partial<RelationshipState>,
  cause: string
): Relationship {
  const rel = ensureRelationship(conversationId, characterId, userId);
  const keys: (keyof RelationshipState)[] = [
    "trust",
    "affection",
    "respect",
    "fear",
    "attraction",
    "loyalty",
    "familiarity",
    "suspicion",
  ];
  const next: any = { ...rel };
  const changes: string[] = [];
  for (const k of keys) {
    if (typeof delta[k] === "number" && delta[k] !== 0) {
      next[k] = clamp((rel[k] as number) + (delta[k] as number), 0, 100);
      changes.push(`${k} ${rel[k]}→${next[k]}`);
    }
  }
  if (delta.stage) next.stage = delta.stage;

  // Recompute stage heuristically if trust/affection shifted a lot
  next.stage = inferStage(next);

  const history = [
    ...rel.history,
    { event: cause || "story event", at: nowIso(), delta: { ...delta } },
  ].slice(-200);

  db.prepare(
    `UPDATE relationships SET stage=?, trust=?, affection=?, respect=?, fear=?,
     attraction=?, loyalty=?, familiarity=?, suspicion=?, history=?, updated_at=? WHERE id=?`
  ).run(
    next.stage,
    next.trust,
    next.affection,
    next.respect,
    next.fear,
    next.attraction,
    next.loyalty,
    next.familiarity,
    next.suspicion,
    JSON.stringify(history),
    nowIso(),
    rel.id
  );

  // Canonical event ledger
  db.prepare(
    `INSERT INTO canonical_events (id, conversation_id, character_id, type, before, after, cause, created_at)
     VALUES (?, ?, ?, 'relationship_change', ?, ?, ?, ?)`
  ).run(
    newId("evt"),
    conversationId,
    characterId,
    JSON.stringify({ stage: rel.stage, trust: rel.trust, affection: rel.affection }),
    JSON.stringify({ stage: next.stage, trust: next.trust, affection: next.affection }),
    cause || "story event",
    nowIso()
  );

  return mapRel(db.prepare("SELECT * FROM relationships WHERE id = ?").get(rel.id) as any);
}

function inferStage(r: RelationshipState): string {
  if (r.trust <= 15 && r.suspicion >= 60) return "Betrayed";
  if (r.fear >= 70 && r.trust <= 20) return "Enemy";
  if (r.suspicion >= 65 && r.affection < 30) return "Rival";
  if (r.attraction >= 70 && r.affection >= 60) return "Partner";
  if (r.attraction >= 55) return "Romantic Interest";
  if (r.trust >= 75 && r.affection >= 60) return "Trusted";
  if (r.trust >= 60 && r.affection >= 50) return "Close Friend";
  if (r.trust >= 45 || r.familiarity >= 40) return "Friend";
  if (r.familiarity >= 15 || r.affection >= 20) return "Acquaintance";
  return "Unknown";
}
