import { json, requireUser, error } from "@/server/http";
import { toggleSocial } from "@/server/services/character";

export const runtime = "nodejs";

/** Toggle a favorite (bookmark) on a character. Server-side counters only. */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);

  const result = toggleSocial(params.id, user.id, "favorite");
  if (!result) return error("Character not found.", 404);
  return json({ favorited: result.active, favorites: result.stats.favorites });
}
