import { json, requireUser, error } from "@/server/http";
import {
  getMessage,
  getConversation,
  updateMessageContent,
  addSwipe,
} from "@/server/services/chat";
import { runGeneration } from "@/server/services/generation";
import { spendPoints, MESSAGE_COST } from "@/server/services/points";

export const runtime = "nodejs";

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

  const parent = msg.parentId ? getMessage(msg.parentId) : null;
  if (!parent) return error("Cannot regenerate the greeting.", 400);

  const spend = spendPoints(user.id, MESSAGE_COST, "regenerate", `Regenerate message ${msg.id}`);
  if (!spend.ok) {
    return json(
      { error: "Not enough points to regenerate.", code: "INSUFFICIENT_POINTS", balance: spend.balance, required: spend.required },
      402
    );
  }

  const { result, usedFallback } = await runGeneration(conv, parent.content);
  updateMessageContent(msg.id, result.text);

  return json({ message: getMessage(msg.id), usedFallback, model: result.model });
}
