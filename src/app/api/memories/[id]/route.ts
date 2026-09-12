import { json, requireUser, readBody, error } from "@/server/http";
import { updateMemory, deleteMemory } from "@/server/services/memory";
import { db } from "@/server/db";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const row = db.prepare("SELECT user_id FROM memories WHERE id = ?").get(params.id) as any;
  if (!row || row.user_id !== user.id) return error("Not found.", 404);
  const body = await readBody<any>(req);
  updateMemory(params.id, body);
  return json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const row = db.prepare("SELECT user_id FROM memories WHERE id = ?").get(params.id) as any;
  if (!row || row.user_id !== user.id) return error("Not found.", 404);
  deleteMemory(params.id);
  return json({ ok: true });
}
