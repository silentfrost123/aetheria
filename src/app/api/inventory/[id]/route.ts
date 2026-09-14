import { json, requireUser, error } from "@/server/http";
import { removeItemById } from "@/server/services/storyEngine";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const removed = removeItemById(params.id, user.id);
  if (!removed) return error("Item not found.", 404);
  return json({ ok: true });
}
