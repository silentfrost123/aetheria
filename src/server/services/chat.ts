import { db, nowIso } from "../db";
import { newId, safeParse, pickRandom, clamp } from "../util";
import type {
  Conversation,
  Message,
  ChatSettings,
  ChatMode,
  StructuredResponse,
  UserSettings,
} from "@/lib/types";
import { loadCharacter } from "./generation";
import { addMemory } from "./memory";
import { ensureRelationship, applyRelationshipDelta } from "./relationship";
import { ensureWorldState } from "./worldState";
import { getProvider, generateRobust } from "../ai";
import { MEMORY_EXTRACT_SYSTEM } from "../prompt/systemPrompts";
import { loadProviderConfig } from "../ai/types";

// ---- Conversations ----

export function createConversation(input: {
  userId: string;
  characterId?: string | null;
  personaId?: string | null;
  worldId?: string | null;
  scenarioId?: string | null;
  title?: string;
  mode?: ChatMode;
  settings?: Partial<ChatSettings>;
}): Conversation {
  const id = newId("con");
  const char = input.characterId ? loadCharacter(input.characterId) : null;
  const mode = input.mode || (char ? "character" : "story");

  // Inherit the user's global preferences as defaults for this chat.
  const userSettings = (() => {
    try {
      const u = db
        .prepare("SELECT settings FROM users WHERE id = ?")
        .get(input.userId) as any;
      return u?.settings
        ? safeParse<Partial<UserSettings>>(u.settings, {})
        : ({} as Partial<UserSettings>);
    } catch {
      return {} as Partial<UserSettings>;
    }
  })();

  const settings: ChatSettings = {
    responseLength: userSettings.responseLength || "medium",
    narrationLevel:
      typeof userSettings.narrationLevel === "number"
        ? userSettings.narrationLevel
        : 0.6,
    creativity:
      typeof userSettings.creativity === "number"
        ? userSettings.creativity
        : 0.85,
    model: userSettings.defaultModel || undefined,
    useMemory: userSettings.useMemory !== false,
    useLorebook: userSettings.useLorebook !== false,
    autoImageGen: false, // AI image generation is not available yet — kept off regardless of stored settings
    autoSummary: userSettings.autoSummary !== false,
    aiSuggestions: userSettings.aiSuggestions !== false,
    ...input.settings,
  };

  db.prepare(
    `INSERT INTO conversations (id, user_id, character_id, persona_id, world_id, scenario_id, title, mode, settings, created_at, updated_at, last_message_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.userId,
    input.characterId || null,
    input.personaId || null,
    input.worldId || null,
    input.scenarioId || null,
    input.title || (char ? `Chat with ${char.name}` : "New story"),
    mode,
    JSON.stringify(settings),
    nowIso(),
    nowIso(),
    nowIso()
  );

  const branchId = newId("brn");
  db.prepare(
    "INSERT INTO branches (id, conversation_id, name, is_active, created_at) VALUES (?, ?, 'main', 1, ?)"
  ).run(branchId, id, nowIso());

  // Greeting message
  if (char && char.greetings?.length) {
    const greeting = pickRandom(char.greetings)!;
    const msgId = newId("msg");
    db.prepare(
      `INSERT INTO messages (id, conversation_id, branch_id, role, content, is_canonical, swipes, created_at)
       VALUES (?, ?, ?, 'assistant', ?, 1, '[]', ?)`
    ).run(msgId, id, branchId, greeting, nowIso());
  }

  // Seed relationship + world state
  if (char) {
    ensureRelationship(id, char.id, input.userId);
    ensureWorldState(id, input.worldId);
  } else if (input.worldId) {
    ensureWorldState(id, input.worldId);
  }

  return loadConversationRow(id)!;
}

function mapConversationRow(row: any): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    characterId: row.character_id,
    personaId: row.persona_id,
    worldId: row.world_id,
    scenarioId: row.scenario_id,
    title: row.title,
    mode: row.mode,
    settings: safeParse(row.settings, {} as ChatSettings),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
  };
}

function loadConversationRow(id: string): Conversation | null {
  const row = db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as any;
  if (!row) return null;
  return mapConversationRow(row);
}

export function getConversation(id: string, userId?: string): Conversation | null {
  const conv = loadConversationRow(id);
  if (!conv) return null;
  if (userId && conv.userId !== userId) return null;
  return conv;
}

export function listConversations(userId: string): Conversation[] {
  const rows = db
    .prepare(
      "SELECT * FROM conversations WHERE user_id = ? ORDER BY last_message_at DESC"
    )
    .all(userId) as any[];
  return rows.map(mapConversationRow);
}

export function getActiveBranch(conversationId: string): { id: string; name: string } {
  const row = db
    .prepare(
      "SELECT * FROM branches WHERE conversation_id = ? AND is_active = 1 LIMIT 1"
    )
    .get(conversationId) as any;
  if (row) return { id: row.id, name: row.name };
  const branchId = newId("brn");
  db.prepare(
    "INSERT INTO branches (id, conversation_id, name, is_active, created_at) VALUES (?, ?, 'main', 1, ?)"
  ).run(branchId, conversationId, nowIso());
  return { id: branchId, name: "main" };
}

export function listMessages(conversationId: string, branchId?: string): Message[] {
  const bid = branchId || getActiveBranch(conversationId).id;
  const rows = db
    .prepare(
      "SELECT * FROM messages WHERE conversation_id = ? AND branch_id = ? ORDER BY created_at ASC"
    )
    .all(conversationId, bid) as any[];
  return rows.map((r) => ({
    id: r.id,
    conversationId: r.conversation_id,
    branchId: r.branch_id,
    role: r.role,
    content: r.content,
    structured: safeParse(r.structured, null),
    model: r.model,
    parentId: r.parent_id,
    isCanonical: !!r.is_canonical,
    swipes: safeParse(r.swipes, []),
    createdAt: r.created_at,
  }));
}

// ---- Message persistence ----

export function storeUserMessage(
  conversationId: string,
  branchId: string,
  content: string
): Message {
  const id = newId("msg");
  db.prepare(
    `INSERT INTO messages (id, conversation_id, branch_id, role, content, is_canonical, swipes, created_at)
     VALUES (?, ?, ?, 'user', ?, 1, '[]', ?)`
  ).run(id, conversationId, branchId, content, nowIso());
  return db
    .prepare("SELECT * FROM messages WHERE id = ?")
    .get(id) as any as Message;
}

export function storeAssistantMessage(
  conversationId: string,
  branchId: string,
  content: string,
  opts: { model?: string; parentId?: string } = {}
): Message {
  const id = newId("msg");
  db.prepare(
    `INSERT INTO messages (id, conversation_id, branch_id, role, content, model, parent_id, is_canonical, swipes, created_at)
     VALUES (?, ?, ?, 'assistant', ?, ?, ?, 1, '[]', ?)`
  ).run(
    id,
    conversationId,
    branchId,
    content,
    opts.model || null,
    opts.parentId || null,
    nowIso()
  );
  touchConversation(conversationId);
  return db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as any as Message;
}

function touchConversation(conversationId: string) {
  db.prepare(
    "UPDATE conversations SET updated_at = ?, last_message_at = ? WHERE id = ?"
  ).run(nowIso(), nowIso(), conversationId);
}

export function getMessage(id: string): Message | null {
  const r = db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    conversationId: r.conversation_id,
    branchId: r.branch_id,
    role: r.role,
    content: r.content,
    structured: safeParse(r.structured, null),
    model: r.model,
    parentId: r.parent_id,
    isCanonical: !!r.is_canonical,
    swipes: safeParse(r.swipes, []),
    createdAt: r.created_at,
  };
}

export function updateMessageContent(id: string, content: string) {
  db.prepare("UPDATE messages SET content = ? WHERE id = ?").run(content, id);
}

export function deleteMessageAndAfter(conversationId: string, messageId: string, branchId: string) {
  const target = getMessage(messageId);
  if (!target) return;
  db.prepare(
    "DELETE FROM messages WHERE conversation_id = ? AND branch_id = ? AND created_at >= ?"
  ).run(conversationId, branchId, target.createdAt);
  touchConversation(conversationId);
}

// ---- Branching ----

export function createBranch(
  conversationId: string,
  parentMessageId: string,
  name?: string
): { id: string; name: string } {
  const branchId = newId("brn");
  db.prepare(
    `INSERT INTO branches (id, conversation_id, parent_message_id, name, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`
  ).run(branchId, conversationId, parentMessageId, name || `branch-${Date.now()}`, nowIso());

  // Deactivate other branches
  db.prepare("UPDATE branches SET is_active = 0 WHERE conversation_id = ? AND id != ?").run(
    conversationId,
    branchId
  );

  // Copy messages up to and including parent
  const parent = getMessage(parentMessageId);
  if (parent) {
    const rows = db
      .prepare(
        "SELECT * FROM messages WHERE conversation_id = ? AND branch_id = ? AND created_at <= ? ORDER BY created_at ASC"
      )
      .all(conversationId, parent.branchId, parent.createdAt) as any[];
    const copy = db.transaction(() => {
      for (const r of rows) {
        db.prepare(
          `INSERT INTO messages (id, conversation_id, branch_id, role, content, structured, model, parent_id, is_canonical, swipes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          newId("msg"),
          conversationId,
          branchId,
          r.role,
          r.content,
          r.structured,
          r.model,
          r.parent_id,
          r.is_canonical,
          r.swipes,
          r.created_at
        );
      }
    });
    copy();
  }
  return { id: branchId, name: name || "branch" };
}

// ---- Swipes ----

export function addSwipe(messageId: string, content: string) {
  const msg = getMessage(messageId);
  if (!msg) return;
  const swipes = [...msg.swipes, { content }];
  db.prepare("UPDATE messages SET swipes = ? WHERE id = ?").run(
    JSON.stringify(swipes),
    messageId
  );
}

export function setMessageToSwipe(messageId: string, content: string) {
  db.prepare("UPDATE messages SET content = ? WHERE id = ?").run(content, messageId);
}

// ---- Memory extraction (fire-and-forget, heuristic + optional LLM) ----

export function queueMemoryExtraction(
  conversationId: string,
  userId: string,
  characterId: string | null,
  userText: string,
  assistantText: string
): void {
  void (async () => {
    try {
      // Heuristic extraction (always runs, cheap)
      extractHeuristicMemories(conversationId, userId, characterId, userText, assistantText);

      // LLM extraction if a remote provider with a memory model is available
      const cfg = loadProviderConfig();
      if (cfg?.apiKey) {
        await extractLlmMemories(conversationId, userId, characterId, userText, assistantText);
      }
    } catch (e) {
      console.error("[memory] extraction failed:", e);
    }
  })();
}

function extractHeuristicMemories(
  conversationId: string,
  userId: string,
  characterId: string | null,
  userText: string,
  assistantText: string
) {
  const combined = `${userText}\n${assistantText}`;
  const char = characterId ? loadCharacter(characterId) : null;
  const charName = char?.name || "";

  const checks: { re: RegExp; type: string; importance: number; build: (m: RegExpMatchArray) => string }[] = [
    {
      re: /(?:i promise|i vow|i swear)\s+(.{10,120})/i,
      type: "promise",
      importance: 0.85,
      build: (m) => `The user promised: ${m[1].trim()}`,
    },
    {
      re: /(?:you saved|i saved|rescued|saved (?:me|you|him|her|them))\s*(.{0,80})/i,
      type: "event",
      importance: 0.8,
      build: () => `A rescue occurred between the user${charName ? ` and ${charName}` : ""}.`,
    },
    {
      re: /(?:i give you|gives? (?:you|him|her|them)|hands? over|i hand you)\s+(.{5,80})/i,
      type: "item",
      importance: 0.7,
      build: (m) => `The user gave an item: ${m[1].trim()}`,
    },
    {
      re: /(?:my name is|i am called|call me)\s+([A-Z][\w'-]+)/i,
      type: "fact",
      importance: 0.9,
      build: (m) => `The user's character revealed their name: ${m[1]}`,
    },
    {
      re: /(?:i trust you|i love you|i hate you|i fear you)\b/i,
      type: "relationship",
      importance: 0.9,
      build: (m) => `The user expressed a strong feeling toward ${charName || "the character"}: "${m[0].trim()}"`,
    },
  ];

  for (const c of checks) {
    const m = combined.match(c.re);
    if (m) {
      addMemory({
        conversationId,
        characterId,
        userId,
        type: c.type,
        importance: c.importance,
        content: c.build(m),
        participants: ["user", charName].filter(Boolean),
        source: "auto",
      });
    }
  }
}

async function extractLlmMemories(
  conversationId: string,
  userId: string,
  characterId: string | null,
  userText: string,
  assistantText: string
) {
  const cfg = loadProviderConfig()!;
  const provider = getProvider();
  const res = await generateRobust({
    model: cfg.memoryModel || cfg.defaultModel,
    temperature: 0.3,
    maxTokens: 700,
    responseFormat: "json",
    messages: [
      { role: "system", content: MEMORY_EXTRACT_SYSTEM },
      {
        role: "user",
        content: `User said: "${userText}"\n\nThe world responded: "${assistantText}"\n\nExtract durable memories.`,
      },
    ],
  });

  let parsed: any[] = [];
  try {
    const cleaned = res.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    const jsonStr = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    parsed = JSON.parse(jsonStr);
  } catch {
    return;
  }

  if (!Array.isArray(parsed)) return;
  for (const m of parsed.slice(0, 5)) {
    if (!m?.content) continue;
    const importance = clamp(Number(m.importance) || 0.5, 0, 1);
    if (importance < 0.55) continue; // only store high-value memories
    addMemory({
      conversationId,
      characterId,
      userId,
      type: String(m.type || "event"),
      importance,
      content: String(m.content),
      participants: Array.isArray(m.participants) ? m.participants.map(String) : [],
      location: m.location ? String(m.location) : undefined,
      emotionalImpact: m.emotionalImpact ? String(m.emotionalImpact) : undefined,
      source: "auto",
    });
  }
}

// ---- Relationship / emotion application ----

/** Lightweight sentiment-driven relationship drift (runs every exchange). */
export function applyHeuristicRelationshipDrift(
  conversationId: string,
  userId: string,
  characterId: string | null,
  userText: string
) {
  if (!characterId) return;
  const t = userText.toLowerCase();
  const pos = /(thank|please|you're (amazing|beautiful|kind)|i trust you|i like you|friend|glad)/i;
  const neg = /(hate|liar|betray|stupid|idiot|shut up|leave me alone|i don't trust you|useless)/i;
  const affection = /(love|kiss|hold|darling|i care|miss you)/i;

  if (affection.test(t)) {
    applyRelationshipDelta(conversationId, characterId, userId, { affection: 4, attraction: 3, familiarity: 2 }, userText);
  } else if (pos.test(t)) {
    applyRelationshipDelta(conversationId, characterId, userId, { affection: 2, trust: 2, familiarity: 1 }, userText);
  } else if (neg.test(t)) {
    applyRelationshipDelta(conversationId, characterId, userId, { trust: -6, affection: -4, suspicion: 8 }, userText);
  } else {
    applyRelationshipDelta(conversationId, characterId, userId, { familiarity: 1 }, userText);
  }
}

export function applyStructuredEffects(
  conversationId: string,
  userId: string,
  characterId: string | null,
  structured?: StructuredResponse | null,
  cause?: string
) {
  if (!characterId) return;
  if (structured?.relationshipChange) {
    const rc = structured.relationshipChange as any;
    if (Object.keys(rc).length) {
      applyRelationshipDelta(conversationId, characterId, userId, rc, cause || "story event");
    }
  }
}
