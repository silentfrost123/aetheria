import { json, requireUser, readBody, error } from "@/server/http";
import { rateLimit, clientIp } from "@/server/rateLimit";
import {
  getConversation,
  getActiveBranch,
  storeUserMessage,
  storeAssistantMessage,
  queueMemoryExtraction,
  applyHeuristicRelationshipDrift,
} from "@/server/services/chat";
import { generateStreaming } from "@/server/services/generation";
import { spendPoints, MESSAGE_COST } from "@/server/services/points";
import { getRelationship, ensureRelationship } from "@/server/services/relationship";
import { getWorldState } from "@/server/services/worldState";
import { listMemories } from "@/server/services/memory";
import { getEntriesForCharacter, getEntriesForWorld } from "@/server/services/lore";
import { getCharacter } from "@/server/services/character";
import { loadEmotionalState } from "@/server/services/generation";
import { getWorld } from "@/server/services/world";
import {
  queueStoryExtraction,
  maybeRunDirector,
  listQuests,
  listInventory,
} from "@/server/services/storyEngine";
import { nowIso } from "@/server/util";
import crypto from "node:crypto";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  // Protect AI spend: per-user burst cap + coarse per-IP cap.
  const ip = clientIp(req);
  const burst = rateLimit(`msg:user:${user.id}`, 20, 60_000);
  const perIp = rateLimit(`msg:ip:${ip}`, 60, 60_000);
  if (!burst.ok || !perIp.ok) {
    return json({ error: "Slow down a little — try again in a minute." }, 429);
  }

  const conv = getConversation(params.id, user.id);
  if (!conv) return error("Conversation not found.", 404);

  const body = await readBody<{ content: string; isOoc?: boolean }>(req);
  const content = (body.content || "").trim();
  if (!content) return error("Message is empty.");
  if (content.length > 4000) return error("Message is too long (max 4000 characters).");

  const branch = getActiveBranch(conv.id);

  // ---- Command handling (no LLM) ----
  const cmd = content.match(/^\/(\w+)(?:\s+(.*))?$/s);
  if (cmd) {
    const result = await handleCommand(conv.id, user.id, conv.characterId ?? null, conv.worldId ?? null, cmd[1], cmd[2] || "");
    if (result) {
      const userMsg = storeUserMessage(conv.id, branch.id, content);
      const assistantMsg = storeAssistantMessage(conv.id, branch.id, result.text, {
        parentId: userMsg.id,
        model: "system",
      });
      return json({ userMessage: userMsg, assistantMessage: assistantMsg });
    }
  }

  // ---- Normal flow: charge points before generating ----
  const spend = spendPoints(
    user.id,
    MESSAGE_COST,
    "message",
    `Message in conversation ${conv.id}`
  );
  if (!spend.ok) {
    return json(
      {
        error: "Not enough points to send a message.",
        code: "INSUFFICIENT_POINTS",
        balance: spend.balance,
        required: spend.required,
      },
      402
    );
  }

  const userMsg = storeUserMessage(conv.id, branch.id, content);
  applyHeuristicRelationshipDrift(conv.id, user.id, conv.characterId ?? null, content);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* client disconnected — ignore */
        }
      };
      let fullText = "";
      let stored = false;

      try {
        const { result, usedFallback } = await generateStreaming(
          conv,
          content,
          (delta) => {
            fullText += delta;
            send("delta", { text: delta });
          },
          { isOoc: body.isOoc }
        );

        const assistantMsg = storeAssistantMessage(conv.id, branch.id, fullText, {
          parentId: userMsg.id,
          model: result.model,
        });
        stored = true;

        queueMemoryExtraction(conv.id, user.id, conv.characterId ?? null, content, fullText);
        queueStoryExtraction(conv.id, user.id, conv.characterId ?? null, content, fullText);
        maybeRunDirector(conv.id, user.id);

        send("done", {
          messageId: assistantMsg.id,
          usedFallback,
          model: result.model,
          content: fullText,
        });
      } catch (e) {
        console.error("[chat] generation error:", e);
        if (!stored) {
          const fallback =
            "*Something went wrong generating the response. The thread remains intact — try again.*";
          storeAssistantMessage(conv.id, branch.id, fallback, { parentId: userMsg.id });
          send("done", { messageId: null, usedFallback: true, content: fallback, error: String(e) });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// ---- Commands ----

async function handleCommand(
  conversationId: string,
  userId: string,
  characterId: string | null,
  worldId: string | null,
  cmd: string,
  arg: string
): Promise<{ text: string } | null> {
  const c = cmd.toLowerCase();

  if (c === "roll") {
    const result = rollDice(arg || "d20");
    return {
      text: `🎲 ${result.summary}\n\n*The dice settle. The world reacts.*`,
    };
  }

  if (c === "status") {
    const lines: string[] = [];
    if (characterId) {
      const rel = getRelationship(conversationId, characterId);
      if (rel) {
        lines.push(`**Relationship** — stage: ${rel.stage}`);
        lines.push(
          `trust ${rel.trust} · affection ${rel.affection} · respect ${rel.respect} · fear ${rel.fear} · attraction ${rel.attraction} · suspicion ${rel.suspicion}`
        );
      }
      const emo = loadEmotionalState(characterId);
      if (emo) {
        lines.push(`**Emotional state** — mood: ${emo.mood}, trust ${emo.trust}, fear ${emo.fear}, anger ${emo.anger}, affection ${emo.affection}, stress ${emo.stress}`);
      }
    }
    const ws = getWorldState(conversationId);
    if (ws) {
      lines.push(`**Scene** — ${ws.currentLocation || "unknown"}, ${ws.timeOfDay}, ${ws.date}, ${ws.season}, ${ws.weather}`);
    }
    if (!lines.length) return { text: "*No active status to display yet.*" };
    return { text: lines.join("\n") };
  }

  if (c === "memory" || c === "memories") {
    const memories = listMemories(conversationId);
    if (!memories.length) return { text: "*No memories recorded yet.*" };
    const top = memories.slice(0, 10);
    return {
      text:
        "**Memories**\n" +
        top.map((m) => `${m.isPinned ? "📌 " : m.isImportant ? "❤️ " : "🧠 "}${m.content}`).join("\n"),
    };
  }

  if (c === "lore") {
    let entries: any[] = [];
    if (characterId) entries.push(...getEntriesForCharacter(characterId));
    if (worldId) entries.push(...getEntriesForWorld(worldId));
    if (!entries.length) return { text: "*No lore entries available.*" };
    return {
      text:
        "**Lore entries**\n" +
        entries
          .map((e) => `• ${e.name} — ${e.content.slice(0, 120)}${e.content.length > 120 ? "…" : ""}`)
          .join("\n"),
    };
  }

  if (c === "scene") {
    const ws = getWorldState(conversationId);
    if (!ws) return { text: "*No scene established yet.*" };
    return {
      text: `📍 ${ws.currentLocation || "Unknown location"} — ${ws.timeOfDay}, ${ws.date} (${ws.season}). Weather: ${ws.weather}.`,
    };
  }

  if (c === "quests" || c === "quest") {
    const quests = listQuests(conversationId).filter(
      (q) => q.status === "active" || q.status === "available"
    );
    if (!quests.length) return { text: "*No open quests. The road ahead is your own.*" };
    return {
      text:
        "**Open quests**\n" +
        quests
          .map(
            (q) =>
              `⚔️ **${q.title}** [${q.status}]${q.objectives.length ? ` — ${q.objectives.filter((o) => o.done).length}/${q.objectives.length} objectives` : ""}${q.reward ? ` — reward: ${q.reward}` : ""}`
          )
          .join("\n"),
    };
  }

  if (c === "inventory" || c === "inv" || c === "items") {
    const items = listInventory(conversationId);
    if (!items.length) return { text: "*Your hands are empty.*" };
    return {
      text:
        "**Inventory**\n" +
        items.map((i) => `🎒 ${i.name} ×${i.quantity}${i.rarity !== "common" ? ` (${i.rarity})` : ""}`).join("\n"),
    };
  }

  if (c === "help") {
    return {
      text:
        "Available commands:\n/roll d20 · /status · /memory · /lore · /scene · /quests · /inventory · /ooc <text> · /help",
    };
  }

  return null; // not a recognized command → fall through to LLM
}

function rollDice(expr: string): { summary: string; total: number; rolls: number[] } {
  const m = expr.trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  let total = 0;
  let rolls: number[] = [];
  if (m) {
    const count = Math.min(m[1] ? parseInt(m[1], 10) : 1, 100);
    // Cap die size so crypto.randomInt can never receive an out-of-range bound
    // (max supported is 2^48) and to prevent absurd values.
    const sides = Math.min(parseInt(m[2], 10) || 6, 1_000_000);
    const mod = m[3] ? parseInt(m[3], 10) : 0;
    for (let i = 0; i < count; i++) {
      const r = crypto.randomInt(1, sides + 1);
      rolls.push(r);
      total += r;
    }
    total += mod;
    return {
      summary: `${expr} → [${rolls.join(", ")}]${mod ? ` ${m[3]}` : ""} = **${total}**`,
      total,
      rolls,
    };
  }
  const r = crypto.randomInt(1, 21);
  return { summary: `d20 → **${r}**`, total: r, rolls: [r] };
}
