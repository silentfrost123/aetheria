import { json, requireUser, error } from "@/server/http";
import { getConversation } from "@/server/services/chat";
import { listInventory } from "@/server/services/storyEngine";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const conv = getConversation(params.id, user.id);
  if (!conv) return error("Conversation not found.", 404);
  return json({ inventory: listInventory(conv.id) });
}
