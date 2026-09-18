import { db, nowIso } from "../db";
import { newId, safeParse } from "../util";
import type {
  Conversation,
  Character,
  Persona,
  World,
  Scenario,
  Message,
  CharacterEmotionalState,
} from "@/lib/types";
import { buildMessages, type PromptContext } from "../prompt/promptBuilder";
import { getProvider, generateRobust, AI_UNAVAILABLE } from "../ai";
import type { GenerateInput, GenerateResult } from "../ai/types";
import { getEntriesForCharacter, getEntriesForWorld, retrieveLore } from "./lore";
import { retrieveMemories } from "./memory";
import { getRelationship } from "./relationship";
import { getWorldState } from "./worldState";
import { listQuests, listInventory } from "./storyEngine";

export function loadCharacter(id: string): Character | null {
  const row = db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as any;
  if (!row) return null;
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

export function loadConversation(id: string): Conversation | null {
  const row = db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    characterId: row.character_id,
    personaId: row.persona_id,
    worldId: row.world_id,
    scenarioId: row.scenario_id,
    title: row.title,
    mode: row.mode,
    settings: safeParse(row.settings, {} as any),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
  };
}

function loadPersona(id?: string | null): Persona | null {
  if (!id) return null;
  const row = db.prepare("SELECT * FROM personas WHERE id = ?").get(id) as any;
  if (!row) return null;
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

function loadWorld(id?: string | null): World | null {
  if (!id) return null;
  const row = db.prepare("SELECT * FROM worlds WHERE id = ?").get(id) as any;
  if (!row) return null;
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

function loadScenario(id?: string | null): Scenario | null {
  if (!id) return null;
  const row = db.prepare("SELECT * FROM scenarios WHERE id = ?").get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description,
    location: row.location,
    time: row.time,
    situation: row.situation,
    characters: safeParse(row.characters, []),
    startingConditions: row.starting_conditions,
    objectives: row.objectives,
    rules: row.rules,
    isPublic: !!row.is_public,
    createdAt: row.created_at,
  };
}

export function loadEmotionalState(characterId: string): CharacterEmotionalState | null {
  const row = db
    .prepare(
      "SELECT value FROM kv_store WHERE key = ?"
    )
    .get(`emotion:${characterId}`) as any;
  return row ? safeParse(row.value, null) : null;
}

export function saveEmotionalState(characterId: string, state: CharacterEmotionalState) {
  db.prepare(
    `INSERT INTO kv_store (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(`emotion:${characterId}`, JSON.stringify(state));
}

/** Recent assistant message contents used for anti-repetition. */
export function getAntiRepetition(conversationId: string, limit = 4): string[] {
  const rows = db
    .prepare(
      "SELECT content FROM messages WHERE conversation_id = ? AND role IN ('assistant','narrator') ORDER BY created_at DESC LIMIT ?"
    )
    .all(conversationId, limit) as any[];
  const phrases: string[] = [];
  for (const r of rows) {
    const m = r.content.match(/"([^"]{4,40})"/g) || [];
    phrases.push(...m.map((s: string) => s.slice(1, -1)));
  }
  return phrases.slice(0, 20);
}

export function getHistory(conversationId: string, max = 30): Message[] {
  const rows = db
    .prepare(
      "SELECT * FROM messages WHERE conversation_id = ? AND is_canonical = 1 ORDER BY created_at ASC"
    )
    .all(conversationId) as any[];
  const messages = rows.map((r) => ({
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
  })) as Message[];
  // keep the tail but always include the greeting
  return messages.slice(-max);
}

/** Assemble the full layered prompt context for a conversation + user message. */
export function assembleContext(
  conversation: Conversation,
  userText: string,
  isOoc: boolean
): PromptContext {
  const char = conversation.characterId
    ? loadCharacter(conversation.characterId)
    : null;
  const persona = loadPersona(conversation.personaId);
  const world = loadWorld(conversation.worldId);
  const scenario = loadScenario(conversation.scenarioId);

  // Lore
  let loreEntries: any[] = [];
  if (char) loreEntries.push(...getEntriesForCharacter(char.id));
  if (world) loreEntries.push(...getEntriesForWorld(world.id));
  const history = getHistory(conversation.id);
  const historyText = history.map((m) => m.content).join(" ");
  const lore = retrieveLore(loreEntries, userText, historyText);

  // Memories
  const memories = retrieveMemories(conversation.id, userText);

  // Relationship
  const relationship = char
    ? getRelationship(conversation.id, char.id)
    : null;

  // World state
  const worldState = getWorldState(conversation.id);

  // Story engine state (quests + inventory)
  const quests = listQuests(conversation.id);
  const inventory = listInventory(conversation.id);

  // Emotional state
  const emotionalState = char ? loadEmotionalState(char.id) : null;

  return {
    character: char,
    persona,
    world,
    scenario,
    lore,
    memories,
    relationship,
    worldState,
    quests,
    inventory,
    emotionalState,
    history,
    mode: conversation.mode === "story" ? "story" : "character",
    responseLength: conversation.settings?.responseLength || "medium",
    isOoc,
    antiRepetition: getAntiRepetition(conversation.id),
  };
}

export interface ChatCallResult {
  result: GenerateResult;
  usedFallback: boolean;
}

export async function runGeneration(
  conversation: Conversation,
  userText: string,
  opts: { isOoc?: boolean; temperature?: number } = {}
): Promise<ChatCallResult> {
  const ctx = assembleContext(conversation, userText, !!opts.isOoc);
  const messages = buildMessages(ctx);
  messages.push({ role: "user", content: userText });

  const input: GenerateInput = {
    messages,
    model: conversation.settings?.model || undefined,
    temperature:
      opts.temperature ??
      conversation.settings?.temperature ??
      conversation.settings?.creativity ??
      0.85,
    maxTokens: 900,
  };

  const res = await generateRobust(input);
  recordUsage(
    conversation.userId,
    conversation.id,
    res.model,
    res.inputTokens,
    res.outputTokens,
    res.latencyMs
  );
  return { result: res, usedFallback: res.usedFallback };
}

export function recordUsage(
  userId: string,
  conversationId: string | null,
  model: string,
  inputTokens: number,
  outputTokens: number,
  latencyMs: number,
  cost = 0
) {
  db.prepare(
    `INSERT INTO usage (id, user_id, conversation_id, model, input_tokens, output_tokens, cost, latency_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId("use"),
    userId,
    conversationId,
    model,
    inputTokens,
    outputTokens,
    cost,
    latencyMs,
    nowIso()
  );
}

export function generateStreaming(
  conversation: Conversation,
  userText: string,
  onChunk: (delta: string) => void,
  opts: { isOoc?: boolean } = {}
): Promise<ChatCallResult> {
  const ctx = assembleContext(conversation, userText, !!opts.isOoc);
  const messages = buildMessages(ctx);
  messages.push({ role: "user", content: userText });

  const provider = getProvider();
  if (provider.id === "offline") {
    return Promise.reject(new Error(AI_UNAVAILABLE));
  }
  const input: GenerateInput = {
    messages,
    model: conversation.settings?.model || undefined,
    temperature:
      conversation.settings?.temperature ??
      conversation.settings?.creativity ??
      0.85,
    maxTokens: 900,
  };

  return provider
    .stream(input, (chunk) => onChunk(chunk.delta))
    .then((result) => {
      recordUsage(
        conversation.userId,
        conversation.id,
        result.model,
        result.inputTokens,
        result.outputTokens,
        result.latencyMs
      );
      return { result, usedFallback: false };
    });
}
