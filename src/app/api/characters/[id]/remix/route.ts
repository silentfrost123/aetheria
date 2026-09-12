import { json, requireUser, error } from "@/server/http";
import { remixCharacter } from "@/server/services/character";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const copy = remixCharacter(params.id, user.id);
  if (!copy) return error("Remix not allowed.", 403);
  return json({ character: copy });
}
