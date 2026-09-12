import { json, requireUser, readBody, error } from "@/server/http";
import { listConversations, createConversation, listMessages } from "@/server/services/chat";
import { getCharacter } from "@/server/services/character";
import { getWorld } from "@/server/services/world";
import { getRelationship } from "@/server/services/relationship";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ conversations: [] });
  const convs = listConversations(user.id);

  const enriched = convs.map((c) => {
    const char = c.characterId ? getCharacter(c.characterId) : null;
    const world = c.worldId ? getWorld(c.worldId) : null;
    const messages = listMessages(c.id);
    const last = messages[messages.length - 1];
    const rel = char ? getRelationship(c.id, char.id) : null;
    return {
      id: c.id,
      title: c.title,
      mode: c.mode,
      character: char
        ? { id: char.id, name: char.name, avatar: char.avatar }
        : null,
      world: world ? { id: world.id, name: world.name, artwork: world.artwork } : null,
      lastMessage: last ? last.content.slice(0, 160) : "",
      lastMessageAt: c.lastMessageAt,
      messageCount: messages.length,
      relationship: rel ? { stage: rel.stage, trust: rel.trust, affection: rel.affection } : null,
    };
  });

  return json({ conversations: enriched });
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);

  if (!body.characterId && !body.worldId && body.mode !== "story") {
    return error("A character or world is required.");
  }

  const conv = createConversation({
    userId: user.id,
    characterId: body.characterId,
    personaId: body.personaId,
    worldId: body.worldId,
    scenarioId: body.scenarioId,
    title: body.title,
    mode: body.mode,
    settings: body.settings,
  });

  return json({ conversation: conv, messages: listMessages(conv.id) });
}
