import { json, requireUser, error } from "@/server/http";
import {
  getMessage,
  getConversation,
  addSwipe,
  setMessageToSwipe,
} from "@/server/services/chat";
import { runGeneration } from "@/server/services/generation";

export const runtime = "nodejs";

/** Generate an alternative response (swipe). Accepts ?select=index to promote a swipe to canonical. */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const msg = getMessage(params.id);
  if (!msg || msg.role !== "assistant") return error("Message not found.", 404);
  const conv = getConversation(msg.conversationId, user.id);
  if (!conv) return error("Conversation not found.", 404);

  const url = new URL(req.url);
  const select = url.searchParams.get("select");

  if (select !== null) {
    const idx = parseInt(select, 10);
    const target = msg.swipes[idx];
    if (!target) return error("Swipe not found.", 404);
    // Push current canonical content into swipes, then promote
    addSwipe(msg.id, msg.content);
    setMessageToSwipe(msg.id, target.content);
    return json({ message: getMessage(msg.id) });
  }

  const parent = msg.parentId ? getMessage(msg.parentId) : null;
  if (!parent) return error("Cannot generate a swipe for the greeting.", 400);

  const { result, usedFallback } = await runGeneration(conv, parent.content);
  addSwipe(msg.id, result.text);

  return json({ message: getMessage(msg.id), usedFallback, model: result.model });
}
