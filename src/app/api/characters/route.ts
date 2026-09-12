import { json, requireUser, readBody, error } from "@/server/http";
import {
  listCharacters,
  createCharacter,
  getCreatorUsername,
} from "@/server/services/character";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = requireUser(req);
  const mine = url.searchParams.get("mine") === "1";
  const filter = {
    query: url.searchParams.get("q") || undefined,
    genre: url.searchParams.get("genre") || undefined,
    gender: url.searchParams.get("gender") || undefined,
    sort: (url.searchParams.get("sort") || "recent") as any,
    creatorId: mine ? user?.id : url.searchParams.get("creator") || undefined,
    includePrivate: mine,
  };
  const chars = listCharacters(filter);

  const cards = chars.map((c) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    species: c.species,
    gender: c.gender,
    creator: { id: c.creatorId, username: getCreatorUsername(c.creatorId) },
    shortDescription: c.shortDescription,
    tags: c.tags,
    stats: c.stats,
  }));

  return json({ characters: cards });
}

export async function POST(req: Request) {
  const user = requireUser(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const body = await readBody<any>(req);
  if (!body.name?.trim()) return error("Name is required.");

  const char = createCharacter(user.id, {
    name: body.name,
    avatar: body.avatar,
    banner: body.banner,
    age: body.age,
    gender: body.gender,
    species: body.species,
    occupation: body.occupation,
    tags: body.tags || [],
    shortDescription: body.shortDescription || "",
    publicDescription: body.publicDescription || "",
    greetings: body.greetings || [],
    definition: body.definition,
    personality: body.personality,
    worldId: body.worldId,
    scenarioId: body.scenarioId,
    isPublic: body.isPublic,
    allowRemix: body.allowRemix,
  });
  return json({ character: char });
}
