import { json, requireUser, readBody, error } from "@/server/http";
import {
  getCharacter,
  updateCharacter,
  deleteCharacter,
  getCreatorUsername,
  getViewerSocial,
} from "@/server/services/character";
import { getAllEntriesForCharacter } from "@/server/services/lore";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  const char = getCharacter(params.id);
  if (!char) return error("Character not found.", 404);

  const isOwner = user?.id === char.creatorId;

  // Private characters are only visible to their creator.
  if (!char.isPublic && !isOwner) {
    return error("Character not found.", 404);
  }

  // Hidden fields (definition, personality) are only exposed to the owner.
  const safeChar = {
    ...char,
    definition: isOwner ? char.definition : undefined,
    personality: isOwner ? char.personality : undefined,
  };

  return json({
    character: {
      ...safeChar,
      creator: { id: char.creatorId, username: getCreatorUsername(char.creatorId) },
    },
    viewer: {
      ...getViewerSocial(params.id, user?.id),
      isOwner,
    },
    lore: isOwner ? getAllEntriesForCharacter(char.id) : undefined,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);
  const char = updateCharacter(params.id, user.id, body);
  if (!char) return error("Not found or not yours.", 404);
  return json({ character: char });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const ok = deleteCharacter(params.id, user.id);
  if (!ok) return error("Not found or not yours.", 404);
  return json({ ok: true });
}
