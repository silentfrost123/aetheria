import type {
  Character,
  Persona,
  World,
  Scenario,
  LoreEntry,
  Memory,
  Relationship,
  WorldState,
  Message,
  CharacterEmotionalState,
  Quest,
  InventoryItem,
} from "@/lib/types";
import {
  NARRATOR_SYSTEM,
  STORY_MODE_SYSTEM,
  OOC_SYSTEM,
  CONTENT_POLICY_DEFAULT,
} from "./systemPrompts";
import type { ChatMessage } from "../ai/types";

export interface PromptContext {
  character?: Character | null;
  persona?: Persona | null;
  world?: World | null;
  scenario?: Scenario | null;
  lore: LoreEntry[];
  memories: Memory[];
  relationship?: Relationship | null;
  worldState?: WorldState | null;
  emotionalState?: CharacterEmotionalState | null;
  quests?: Quest[];
  inventory?: InventoryItem[];
  history: Message[];
  mode: "character" | "story";
  responseLength: string;
  isOoc: boolean;
  antiRepetition: string[];
}

// ---- Placeholder substitution ----

export function substitutePlaceholders(
  text: string,
  vars: Record<string, string>
): string {
  let out = text;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export function buildPlaceholderVars(ctx: {
  char?: Character | null;
  persona?: Persona | null;
  world?: World | null;
  scenario?: Scenario | null;
}): Record<string, string> {
  const char = ctx.char;
  return {
    char: char?.name || "",
    user: ctx.persona?.name || "You",
    world: ctx.world?.name || "",
    scenario: ctx.scenario?.title || "",
    persona: personaToText(ctx.persona),
    memory: "",
  };
}

function personaToText(p?: Persona | null): string {
  if (!p) return "The user's character.";
  return [
    `Name: ${p.name}`,
    p.age ? `Age: ${p.age}` : "",
    p.occupation ? `Occupation: ${p.occupation}` : "",
    p.personality ? `Personality: ${p.personality}` : "",
    p.appearance ? `Appearance: ${p.appearance}` : "",
    p.background ? `Background: ${p.background}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ---- Character definition rendering ----

export function renderCharacterDefinition(
  char: Character,
  vars: Record<string, string>
): string {
  const d = char.definition || ({} as Character["definition"]);
  const fields: [string, string][] = [
    ["Identity", d.identity],
    ["Personality", d.personality],
    ["Appearance", d.appearance],
    ["Speech style", d.speechStyle],
    ["Behavior", d.behavior],
    ["Emotional logic", d.emotionalLogic],
    ["Likes", d.likes],
    ["Dislikes", d.dislikes],
    ["Fears", d.fears],
    ["Goals", d.goals],
    ["Motivations", d.motivations],
    ["Secrets", d.secrets],
    ["Backstory", d.backstory],
    ["Relationships", d.relationships],
    ["World knowledge", d.worldKnowledge],
    ["Rules", d.rules],
  ];

  const lines: string[] = [`CHARACTER: ${char.name}`];
  if (char.age) lines.push(`Age: ${char.age}`);
  if (char.gender) lines.push(`Gender: ${char.gender}`);
  if (char.species) lines.push(`Species: ${char.species}`);
  if (char.occupation) lines.push(`Occupation: ${char.occupation}`);

  for (const [label, value] of fields) {
    if (!value || !value.trim()) continue;
    lines.push(`${label}: ${substitutePlaceholders(value.trim(), vars)}`);
  }

  const ex = d.exampleDialogues;
  if (ex && ex.trim()) {
    lines.push(
      `Example dialogues (style reference — match this voice):\n${substitutePlaceholders(
        ex.trim(),
        vars
      )}`
    );
  }

  const p = char.personality || ({} as Character["personality"]);
  const pv = Object.entries(p).filter(([, v]) => typeof v === "number");
  if (pv.length) {
    lines.push(
      `Personality profile (0-1): ${pv
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`
    );
  }

  return lines.join("\n");
}

export function renderEmotionalState(s?: CharacterEmotionalState | null): string {
  if (!s) return "";
  const { mood, ...vals } = s;
  return `Current emotional state: mood=${mood}, ${Object.entries(vals)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ")}`;
}

export function renderRelationship(r?: Relationship | null): string {
  if (!r) return "";
  return `Relationship with ${"the user"}: stage=${r.stage}, trust=${r.trust}, affection=${r.affection}, respect=${r.respect}, fear=${r.fear}, attraction=${r.attraction}, loyalty=${r.loyalty}, familiarity=${r.familiarity}, suspicion=${r.suspicion}`;
}

export function renderWorldState(s?: WorldState | null): string {
  if (!s) return "";
  return `CURRENT SCENE — Location: ${s.currentLocation || "unspecified"}. Time: ${s.timeOfDay}, ${s.date}, ${s.season}. Weather: ${s.weather}.`;
}

export function renderWorldRules(w?: World | null): string {
  if (!w) return "";
  const parts: string[] = [];
  if (w.description) parts.push(w.description);
  if (w.magicSystem) parts.push(`Magic system: ${w.magicSystem}`);
  if (w.technology) parts.push(`Technology: ${w.technology}`);
  if (w.politics) parts.push(`Politics: ${w.politics}`);
  if (w.history) parts.push(`History: ${w.history}`);
  if (w.rules) parts.push(`World rules: ${w.rules}`);
  if (!parts.length) return "";
  return `WORLD: ${w.name} (${w.genre})\n${parts.join("\n")}`;
}

export function renderScenario(s?: Scenario | null): string {
  if (!s) return "";
  const parts = [
    s.title ? `Scenario: ${s.title}` : "",
    s.description,
    s.location ? `Location: ${s.location}` : "",
    s.time ? `Time: ${s.time}` : "",
    s.situation,
    s.startingConditions ? `Starting conditions: ${s.startingConditions}` : "",
    s.objectives ? `Objectives: ${s.objectives}` : "",
    s.rules ? `Rules: ${s.rules}` : "",
  ].filter(Boolean);
  if (!parts.length) return "";
  return parts.join("\n");
}

export function renderLore(entries: LoreEntry[]): string {
  if (!entries.length) return "";
  const sorted = [...entries].sort((a, b) => b.priority - a.priority);
  return (
    "RELEVANT WORLD LORE (inject subtly where relevant, do not dump verbatim):\n" +
    sorted.map((e) => `- ${e.name}: ${e.content}`).join("\n")
  );
}

export function renderMemories(memories: Memory[]): string {
  if (!memories.length) return "";
  const sorted = [...memories].sort((a, b) => b.importance - a.importance);
  return (
    "IMPORTANT MEMORIES (established facts — honor them):\n" +
    sorted.map((m) => `- ${m.content}`).join("\n")
  );
}

export function renderQuests(quests: Quest[]): string {
  const open = quests.filter((q) => q.status === "active" || q.status === "available");
  if (!open.length) return "";
  return (
    "ACTIVE QUESTS (established commitments — characters may reference, pressure, or reward them):\n" +
    open
      .slice(0, 6)
      .map(
        (q) =>
          `- ${q.title} [${q.status}]` +
          (q.objectives?.length
            ? ` — objectives: ${q.objectives.map((o) => `${o.text}${o.done ? " ✓" : ""}`).join("; ")}`
            : "") +
          (q.reward ? ` — reward: ${q.reward}` : "")
      )
      .join("\n")
  );
}

export function renderInventory(items: InventoryItem[]): string {
  if (!items.length) return "";
  return (
    "USER INVENTORY (the user's character possesses exactly these items — never assume others):\n" +
    items
      .slice(0, 12)
      .map((i) => `- ${i.name} ×${i.quantity}${i.rarity !== "common" ? ` (${i.rarity})` : ""}`)
      .join("\n")
  );
}

// ---- Response length guidance ----

function lengthGuidance(len: string): string {
  const map: Record<string, string> = {
    short: "Keep your response brief — 1–3 sentences.",
    medium: "Keep your response moderate — around a short paragraph.",
    long: "Write a fuller response — a rich paragraph or two.",
    very_long: "Write an extended, immersive response — multiple paragraphs.",
    adaptive: "Match your length naturally to the intensity of the scene.",
  };
  return map[len] || map.adaptive;
}

// ---- Main context builder ----

export function buildMessages(ctx: PromptContext): ChatMessage[] {
  const vars = buildPlaceholderVars(ctx);
  const messages: ChatMessage[] = [];

  // 1. System instruction
  const baseSystem =
    ctx.mode === "story" ? STORY_MODE_SYSTEM : NARRATOR_SYSTEM;
  const sysParts = [ctx.isOoc ? OOC_SYSTEM : baseSystem];

  // Platform content policy (server-side only)
  sysParts.push(CONTENT_POLICY_DEFAULT);

  // 2. World rules
  const worldRules = renderWorldRules(ctx.world);
  if (worldRules) sysParts.push(worldRules);

  // 3. Character definition
  if (ctx.character) {
    sysParts.push(
      `You are roleplaying as the character below. Embody them completely.\n${renderCharacterDefinition(
        ctx.character,
        vars
      )}`
    );
  }

  // 4. User persona
  if (ctx.persona) {
    sysParts.push(
      `USER CHARACTER (the protagonist — controlled by the user, never by you):\n${personaToText(
        ctx.persona
      )}`
    );
  }

  // 5. Scenario
  const scen = renderScenario(ctx.scenario);
  if (scen) sysParts.push(scen);

  // 6. Relevant lore
  const lore = renderLore(ctx.lore);
  if (lore) sysParts.push(lore);

  // 7. Relevant memories
  const mem = renderMemories(ctx.memories);
  if (mem) sysParts.push(mem);

  // 8. Current world state
  const ws = renderWorldState(ctx.worldState);
  if (ws) sysParts.push(ws);

  // 8b. Quests + inventory (story engine state)
  const questText = renderQuests(ctx.quests || []);
  if (questText) sysParts.push(questText);
  const invText = renderInventory(ctx.inventory || []);
  if (invText) sysParts.push(invText);

  // 9. Relationship + emotional state
  const rel = renderRelationship(ctx.relationship);
  if (rel) sysParts.push(rel);
  const emo = renderEmotionalState(ctx.emotionalState);
  if (emo) sysParts.push(emo);

  // 10. Post-history instructions
  const post = [
    lengthGuidance(ctx.responseLength),
    "Remember: never write the user's dialogue, thoughts, or decisions.",
    "Never fabricate dice rolls or random outcomes — chance is resolved by the game system when the user rolls.",
    ctx.antiRepetition.length
      ? `Avoid reusing these recently-used phrases/descriptions unless intentional: ${ctx.antiRepetition
          .slice(0, 12)
          .join("; ")}.`
      : "",
  ].filter(Boolean);
  sysParts.push(post.join(" "));

  messages.push({ role: "system", content: sysParts.join("\n\n") });

  // History
  for (const m of ctx.history) {
    const role = m.role === "user" ? "user" : "assistant";
    messages.push({ role, content: m.content });
  }

  return messages;
}
