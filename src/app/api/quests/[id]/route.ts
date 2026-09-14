import { json, requireUser, readBody, error } from "@/server/http";
import { getQuest, updateQuest } from "@/server/services/storyEngine";
import type { QuestStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const existing = getQuest(params.id);
  if (!existing) return error("Quest not found.", 404);
  if (existing.userId !== user.id) return error("Quest not found.", 404);

  const body = await readBody<{
    status?: QuestStatus;
    objectiveIndex?: number;
  }>(req);

  const patch: { status?: QuestStatus; objectiveIndex?: number } = {};
  if (body.status) patch.status = body.status;
  if (typeof body.objectiveIndex === "number") patch.objectiveIndex = body.objectiveIndex;
  if (!Object.keys(patch).length) return error("Nothing to update.");

  const updated = updateQuest(params.id, user.id, patch);
  if (!updated) return error("Quest not found.", 404);
  return json({ quest: updated });
}
