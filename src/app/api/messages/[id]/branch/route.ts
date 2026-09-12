import { json, requireUser, error } from "@/server/http";
import { getMessage, getConversation, createBranch } from "@/server/services/chat";

export const runtime = "nodejs";

/** Create an alternate timeline branching from this message. */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const msg = getMessage(params.id);
  if (!msg) return error("Message not found.", 404);
  const conv = getConversation(msg.conversationId, user.id);
  if (!conv) return error("Conversation not found.", 404);

  const branch = createBranch(conv.id, msg.id);
  return json({ branch, branchMessageId: msg.id });
}
