import { json, requireUser, readBody, error } from "@/server/http";
import { getConversation } from "@/server/services/chat";
import { listQuests, createQuest } from "@/server/services/storyEngine";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const conv = getConversation(params.id, user.id);
  if (!conv) return error("Conversation not found.", 404);
  return json({ quests: listQuests(conv.id) });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const conv = getConversation(params.id, user.id);
  if (!conv) return error("Conversation not found.", 404);

  const body = await readBody<{
    title: string;
    description?: string;
    objectives?: string[];
    difficulty?: string;
    reward?: string;
  }>(req);
  const title = (body.title || "").trim();
  if (!title) return error("Quest title is required.");
  if (title.length > 80) return error("Quest title is too long (max 80 characters).");

  const quest = createQuest({
    conversationId: conv.id,
    userId: user.id,
    title,
    description: body.description,
    objectives: Array.isArray(body.objectives) ? body.objectives : [],
    difficulty: body.difficulty,
    reward: body.reward,
    status: "active",
    source: "user",
  });
  return json({ quest }, 201);
}
