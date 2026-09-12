import { json, requireUser, readBody } from "@/server/http";
import { listPersonas, createPersona } from "@/server/services/persona";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ personas: [] });
  return json({ personas: listPersonas(user.id) });
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);
  const persona = createPersona(user.id, body);
  return json({ persona });
}
