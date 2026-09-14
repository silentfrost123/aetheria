import { db, nowIso } from "../db";
import { newId, clamp, safeParse } from "../util";
import type {
  Quest,
  QuestObjective,
  QuestStatus,
  InventoryItem,
  ItemRarity,
} from "@/lib/types";
import { getProvider, generateRobust } from "../ai";
import { loadProviderConfig } from "../ai/types";
import { STORY_EXTRACT_SYSTEM, DIRECTOR_SYSTEM } from "../prompt/systemPrompts";
import { getActiveBranch, listMessages } from "./chat";
import { getWorldState } from "./worldState";

const QUEST_STATUSES: QuestStatus[] = ["available", "active", "completed", "failed", "expired"];
const RARITIES: ItemRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

// ---- Quests ----

function mapQuest(r: any): Quest {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    userId: r.user_id,
    title: r.title,
    description: r.description || "",
    objectives: safeParse<QuestObjective[]>(r.objectives, []),
    status: r.status as QuestStatus,
    difficulty: r.difficulty || "normal",
    reward: r.reward || "",
    giver: r.giver || "",
    source: r.source || "auto",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at || null,
  };
}

const QUEST_ORDER = "CASE status WHEN 'active' THEN 0 WHEN 'available' THEN 1 WHEN 'completed' THEN 2 WHEN 'failed' THEN 3 ELSE 4 END";

export function listQuests(conversationId: string): Quest[] {
  const rows = db
    .prepare(`SELECT * FROM quests WHERE conversation_id = ? ORDER BY ${QUEST_ORDER}, updated_at DESC`)
    .all(conversationId) as any[];
  return rows.map(mapQuest);
}

export function getQuest(id: string): Quest | null {
  const r = db.prepare("SELECT * FROM quests WHERE id = ?").get(id) as any;
  return r ? mapQuest(r) : null;
}

export function createQuest(input: {
  conversationId: string;
  userId: string;
  title: string;
  description?: string;
  objectives?: string[];
  status?: QuestStatus;
  difficulty?: string;
  reward?: string;
  giver?: string;
  source?: string;
}): Quest {
  const id = newId("qst");
  const objectives: QuestObjective[] = (input.objectives || [])
    .filter((o) => typeof o === "string" && o.trim())
    .slice(0, 6)
    .map((o) => ({ text: o.trim().slice(0, 120), done: false }));
  db.prepare(
    `INSERT INTO quests (id, conversation_id, user_id, title, description, objectives, status, difficulty, reward, giver, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.conversationId,
    input.userId,
    input.title.trim().slice(0, 80),
    (input.description || "").slice(0, 500),
    JSON.stringify(objectives),
    QUEST_STATUSES.includes(input.status as QuestStatus) ? input.status! : "active",
    (input.difficulty || "normal").slice(0, 20),
    (input.reward || "").slice(0, 120),
    (input.giver || "").slice(0, 60),
    input.source || "auto",
    nowIso(),
    nowIso()
  );
  return getQuest(id)!;
}

export function updateQuest(
  id: string,
  userId: string,
  patch: { status?: QuestStatus; objectiveIndex?: number; objectiveDone?: string | null }
): Quest | null {
  const q = getQuest(id);
  if (!q || q.userId !== userId) return null;

  let objectives = [...q.objectives];
  if (typeof patch.objectiveIndex === "number" && objectives[patch.objectiveIndex]) {
    objectives[patch.objectiveIndex] = { ...objectives[patch.objectiveIndex], done: true };
  }
  if (patch.objectiveDone) {
    const needle = patch.objectiveDone.toLowerCase();
    const idx = objectives.findIndex((o) => !o.done && o.text.toLowerCase().includes(needle.slice(0, 40)));
    if (idx >= 0) objectives[idx] = { ...objectives[idx], done: true };
  }

  let status: QuestStatus = patch.status && QUEST_STATUSES.includes(patch.status) ? patch.status : q.status;
  if (objectives.length && objectives.every((o) => o.done)) status = "completed";

  const completedAt = status === "completed" ? q.completedAt || nowIso() : null;
  db.prepare(
    "UPDATE quests SET objectives = ?, status = ?, completed_at = ?, updated_at = ? WHERE id = ?"
  ).run(JSON.stringify(objectives), status, completedAt, nowIso(), id);
  return getQuest(id);
}

// ---- Inventory ----

function mapItem(r: any): InventoryItem {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    userId: r.user_id,
    name: r.name,
    description: r.description || "",
    rarity: r.rarity as ItemRarity,
    quantity: r.quantity,
    weight: r.weight,
    effects: r.effects || "",
    lore: r.lore || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listInventory(conversationId: string): InventoryItem[] {
  const rows = db
    .prepare("SELECT * FROM inventory_items WHERE conversation_id = ? ORDER BY created_at ASC")
    .all(conversationId) as any[];
  return rows.map(mapItem);
}

export function addItem(
  conversationId: string,
  userId: string,
  input: { name: string; description?: string; rarity?: string; quantity?: number; effects?: string; lore?: string }
): InventoryItem {
  const name = input.name.trim().slice(0, 60);
  const existing = db
    .prepare("SELECT * FROM inventory_items WHERE conversation_id = ? AND lower(name) = lower(?)")
    .get(conversationId, name) as any;
  const qty = clamp(Math.round(Number(input.quantity) || 1), 1, 9999);

  if (existing) {
    db.prepare(
      "UPDATE inventory_items SET quantity = ?, description = COALESCE(NULLIF(?, ''), description), updated_at = ? WHERE id = ?"
    ).run(Math.min(existing.quantity + qty, 9999), (input.description || "").slice(0, 300), nowIso(), existing.id);
    return mapItem(db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(existing.id));
  }

  const id = newId("itm");
  db.prepare(
    `INSERT INTO inventory_items (id, conversation_id, user_id, name, description, rarity, quantity, effects, lore, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    conversationId,
    userId,
    name,
    (input.description || "").slice(0, 300),
    RARITIES.includes(input.rarity as ItemRarity) ? input.rarity! : "common",
    qty,
    (input.effects || "").slice(0, 200),
    (input.lore || "").slice(0, 300),
    nowIso(),
    nowIso()
  );
  return mapItem(db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(id));
}

export function removeItemById(id: string, userId: string): boolean {
  const r = db.prepare("DELETE FROM inventory_items WHERE id = ? AND user_id = ?").run(id, userId);
  return r.changes > 0;
}

export function consumeItemByName(conversationId: string, name: string, qty = 1): void {
  const row = db
    .prepare("SELECT * FROM inventory_items WHERE conversation_id = ? AND lower(name) = lower(?)")
    .get(conversationId, name.trim()) as any;
  if (!row) return;
  const remaining = row.quantity - Math.max(1, qty);
  if (remaining <= 0) {
    db.prepare("DELETE FROM inventory_items WHERE id = ?").run(row.id);
  } else {
    db.prepare("UPDATE inventory_items SET quantity = ?, updated_at = ? WHERE id = ?").run(remaining, nowIso(), row.id);
  }
}

// ---- Story-state extraction (fire-and-forget: heuristic + LLM) ----

const GAIN_PATTERNS = [
  /(?:you (?:find|take|pick up|grab|loot|receive)|i (?:take|pick up|grab|loot)|hands? you|you are given)\s+(?:a |an |the )?((?:[A-Za-z][\w'-]*)(?: [A-Za-z][\w'-]*)?)(?=[\s]*[.,;:!?\n)\]]|$)/i,
];
const LOSE_PATTERNS = [
  /i (?:give|hand) you\s+(?:a |an |the )?([\w'-]{3,40})/i,
  /you (?:consume|eat|drink)\s+(?:a |an |the )?([\w'-]{3,40})/i,
];

export function extractHeuristicStoryState(
  conversationId: string,
  userId: string,
  userText: string,
  assistantText: string
) {
  const combined = `${userText}\n${assistantText}`;
  for (const re of GAIN_PATTERNS) {
    const m = combined.match(re);
    if (m?.[1]) addItem(conversationId, userId, { name: m[1], source: "auto" } as any);
  }
  for (const re of LOSE_PATTERNS) {
    const m = userText.match(re);
    if (m?.[1]) consumeItemByName(conversationId, m[1]);
  }
}

export function queueStoryExtraction(
  conversationId: string,
  userId: string,
  characterId: string | null,
  userText: string,
  assistantText: string
): void {
  void (async () => {
    try {
      extractHeuristicStoryState(conversationId, userId, userText, assistantText);
      const cfg = loadProviderConfig();
      if (cfg?.apiKey) {
        await extractLlmStoryState(conversationId, userId, userText, assistantText);
      }
    } catch (e) {
      console.error("[story] extraction failed:", e);
    }
  })();
  void characterId;
}

function titlesSimilar(a: string, b: string): boolean {
  const x = a.toLowerCase().trim();
  const y = b.toLowerCase().trim();
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 6 && y.includes(x)) return true;
  if (y.length >= 6 && x.includes(y)) return true;
  return false;
}

async function extractLlmStoryState(
  conversationId: string,
  userId: string,
  userText: string,
  assistantText: string
) {
  const cfg = loadProviderConfig()!;
  const existing = listQuests(conversationId);
  const open = existing.filter((q) => q.status === "active" || q.status === "available");

  const res = await generateRobust({
    model: cfg.memoryModel || cfg.defaultModel,
    temperature: 0.2,
    maxTokens: 700,
    responseFormat: "json",
    messages: [
      { role: "system", content: STORY_EXTRACT_SYSTEM },
      {
        role: "user",
        content:
          `Open quests:\n${open.map((q) => `- ${q.title} [${q.status}]`).join("\n") || "(none)"}\n\n` +
          `User did/said: "${userText}"\n\nThe world responded: "${assistantText}"\n\nExtract updates.`,
      },
    ],
  });

  let parsed: any = null;
  try {
    const cleaned = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    parsed = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
  } catch {
    return;
  }
  if (!parsed || typeof parsed !== "object") return;

  // New quests (deduped by title)
  if (Array.isArray(parsed.quests)) {
    for (const q of parsed.quests.slice(0, 2)) {
      if (!q?.title || typeof q.title !== "string" || !q.title.trim()) continue;
      const title = q.title.trim().slice(0, 80);
      if (existing.some((e) => titlesSimilar(e.title, title))) continue;
      const created = createQuest({
        conversationId,
        userId,
        title,
        description: typeof q.description === "string" ? q.description : "",
        objectives: Array.isArray(q.objectives) ? q.objectives.filter((o: any) => typeof o === "string") : [],
        difficulty: typeof q.difficulty === "string" ? q.difficulty : "normal",
        reward: typeof q.reward === "string" ? q.reward : "",
        giver: typeof q.giver === "string" ? q.giver : "",
        status: q.status === "active" ? "active" : "available",
        source: "auto",
      });
      existing.push(created);
    }
  }

  // Quest updates
  if (Array.isArray(parsed.questUpdates)) {
    for (const u of parsed.questUpdates.slice(0, 4)) {
      if (!u?.title || typeof u.title !== "string") continue;
      const target = existing.find((e) => titlesSimilar(e.title, u.title));
      if (!target) continue;
      const patch: { status?: QuestStatus; objectiveDone?: string | null } = {};
      if (["active", "completed", "failed"].includes(u.status)) patch.status = u.status as QuestStatus;
      if (typeof u.objectiveDone === "string" && u.objectiveDone) patch.objectiveDone = u.objectiveDone;
      if (Object.keys(patch).length) updateQuest(target.id, userId, patch);
    }
  }

  // Items gained / lost
  if (Array.isArray(parsed.items)) {
    for (const it of parsed.items.slice(0, 4)) {
      if (!it?.name || typeof it.name !== "string" || !it.name.trim()) continue;
      addItem(conversationId, userId, {
        name: it.name,
        description: typeof it.description === "string" ? it.description : "",
        rarity: typeof it.rarity === "string" ? it.rarity : "common",
        quantity: typeof it.quantity === "number" ? it.quantity : 1,
        effects: typeof it.effects === "string" ? it.effects : "",
      });
    }
  }
  if (Array.isArray(parsed.itemRemovals)) {
    for (const name of parsed.itemRemovals.slice(0, 4)) {
      if (typeof name === "string" && name.trim()) consumeItemByName(conversationId, name);
    }
  }
}

// ---- AI Story Director (conservative, rate-limited background beat) ----

const DIRECTOR_EVERY = 8; // run at most once per N assistant turns
const DIRECTOR_COOLDOWN_MS = 120_000;

export function maybeRunDirector(
  conversationId: string,
  userId: string
): void {
  void (async () => {
    try {
      const branch = getActiveBranch(conversationId);
      const msgs = listMessages(conversationId, branch.id);
      const assistantTurns = msgs.filter((m) => m.role === "assistant" && m.model !== "system").length;
      if (!assistantTurns || assistantTurns % DIRECTOR_EVERY !== 0) return;

      const key = `director:last:${conversationId}`;
      const row = db.prepare("SELECT value FROM kv_store WHERE key = ?").get(key) as any;
      if (row && Date.now() - Number(row.value) < DIRECTOR_COOLDOWN_MS) return;
      db.prepare(
        `INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      ).run(key, String(Date.now()), nowIso());

      const cfg = loadProviderConfig();
      if (!cfg?.apiKey) return;

      const recent = msgs
        .slice(-12)
        .map((m) => `${m.role === "user" ? "User" : "World"}: ${m.content.slice(0, 300)}`)
        .join("\n");
      const open = listQuests(conversationId)
        .filter((q) => q.status === "active" || q.status === "available")
        .map((q) => `- ${q.title} [${q.status}]`)
        .join("\n");
      const ws = getWorldState(conversationId);

      const res = await generateRobust({
        model: cfg.memoryModel || cfg.defaultModel,
        temperature: 0.6,
        maxTokens: 350,
        responseFormat: "json",
        messages: [
          { role: "system", content: DIRECTOR_SYSTEM },
          {
            role: "user",
            content:
              `Open quests:\n${open || "(none)"}\n\n` +
              `Scene: ${ws ? `${ws.currentLocation || "unknown"}, ${ws.timeOfDay}, ${ws.date}` : "unknown"}\n\n` +
              `Recent transcript:\n${recent}\n\nDecide.`,
          },
        ],
      });

      let parsed: any = null;
      try {
        const cleaned = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        parsed = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
      } catch {
        return;
      }
      if (parsed?.intervene !== true || typeof parsed.event !== "string" || parsed.event.trim().length < 20) return;

      const event = parsed.event.trim().slice(0, 600);
      db.prepare(
        `INSERT INTO messages (id, conversation_id, branch_id, role, content, model, is_canonical, swipes, created_at)
         VALUES (?, ?, ?, 'assistant', ?, 'system', 1, '[]', ?)`
      ).run(newId("msg"), conversationId, branch.id, `🎬 ${event}`, nowIso());
      db.prepare(
        `INSERT INTO canonical_events (id, conversation_id, type, before, after, cause, created_at)
         VALUES (?, ?, 'director_event', '{}', ?, ?, ?)`
      ).run(
        newId("evt"),
        conversationId,
        JSON.stringify({ event }),
        String(parsed.reason || "story director").slice(0, 200),
        nowIso()
      );
    } catch (e) {
      console.error("[director] failed:", e);
    }
  })();
  void userId;
}
