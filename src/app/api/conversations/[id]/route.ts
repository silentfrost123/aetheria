import { json, requireUser, readBody, error } from "@/server/http";
import { getConversation, listMessages, getActiveBranch } from "@/server/services/chat";
import { getCharacter } from "@/server/services/character";
import { getWorld } from "@/server/services/world";
import { getRelationship } from "@/server/services/relationship";
import { getWorldState } from "@/server/services/worldState";
import { listMemories } from "@/server/services/memory";
import { db } from "@/server/db";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const conv = getConversation(params.id, user.id);
  if (!conv) return error("Conversation not found.", 404);

  const branch = getActiveBranch(conv.id);
  const messages = listMessages(conv.id, branch.id);
  const char = conv.characterId ? getCharacter(conv.characterId) : null;
  const world = conv.worldId ? getWorld(conv.worldId) : null;
  const rel = char ? getRelationship(conv.id, char.id) : null;
  const worldState = getWorldState(conv.id);
  const memories = listMemories(conv.id, { pinnedFirst: true });

  return json({
    conversation: {
      ...conv,
      character: char
        ? {
            id: char.id,
            name: char.name,
            avatar: char.avatar,
            species: char.species,
            tags: char.tags,
            shortDescription: char.shortDescription,
          }
        : null,
      world: world ? { id: world.id, name: world.name, artwork: world.artwork } : null,
    },
    branch,
    messages,
    relationship: rel,
    worldState,
    memories,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const conv = getConversation(params.id, user.id);
  if (!conv) return error("Conversation not found.", 404);
  db.prepare("DELETE FROM conversations WHERE id = ?").run(conv.id);
  return json({ ok: true });
}
