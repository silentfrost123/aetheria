import { json, requireUser, readBody, error } from "@/server/http";
import { listMemories, addMemory } from "@/server/services/memory";
import { getConversation } from "@/server/services/chat";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ memories: [] });
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) return json({ memories: [] });
  // Ownership check: only the conversation owner may read its memories.
  if (!getConversation(conversationId, user.id)) return json({ memories: [] });
  return json({ memories: listMemories(conversationId, { pinnedFirst: true }) });
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);
  if (!body.conversationId || !body.content?.trim()) {
    return error("conversationId and content are required.");
  }
  // Ownership check: only the conversation owner may add memories to it.
  if (!getConversation(body.conversationId, user.id)) {
    return error("Conversation not found.", 404);
  }
  const memory = addMemory({
    conversationId: body.conversationId,
    characterId: body.characterId,
    userId: user.id,
    type: body.type || "fact",
    importance: body.importance ?? 0.8,
    content: body.content,
    participants: body.participants || [],
    source: "manual",
  });
  return json({ memory });
}
