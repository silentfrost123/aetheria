import { json, requireUser, readBody, error } from "@/server/http";
import {
  getMessage,
  getConversation,
  updateMessageContent,
  deleteMessageAndAfter,
} from "@/server/services/chat";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const msg = getMessage(params.id);
  if (!msg) return error("Message not found.", 404);
  const conv = getConversation(msg.conversationId, user.id);
  if (!conv) return error("Conversation not found.", 404);

  const body = await readBody<{ content: string }>(req);
  if (body.content === undefined) return error("Content required.");
  updateMessageContent(msg.id, body.content);
  return json({ message: getMessage(msg.id) });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const msg = getMessage(params.id);
  if (!msg) return error("Message not found.", 404);
  const conv = getConversation(msg.conversationId, user.id);
  if (!conv) return error("Conversation not found.", 404);

  const url = new URL(req.url);
  const truncate = url.searchParams.get("truncate") === "1";
  if (truncate) {
    deleteMessageAndAfter(conv.id, msg.id, msg.branchId);
  } else {
    updateMessageContent(msg.id, "");
  }
  return json({ ok: true });
}
