import { json, requireUser, readBody, error } from "@/server/http";
import { updatePersona, deletePersona } from "@/server/services/persona";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);
  const persona = updatePersona(params.id, user.id, body);
  if (!persona) return error("Not found.", 404);
  return json({ persona });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  if (!deletePersona(params.id, user.id)) return error("Not found.", 404);
  return json({ ok: true });
}
