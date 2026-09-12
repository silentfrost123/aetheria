import { json } from "@/server/http";
import { listCharacters, getCreatorUsername } from "@/server/services/character";
import { listWorlds } from "@/server/services/world";
import { GENRES } from "@/server/constants";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  const genre = url.searchParams.get("genre") || undefined;
  const sort = (url.searchParams.get("sort") || "trending") as any;

  const chars = listCharacters({ query: q, genre, sort }).map((c) => ({
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

  const worlds = listWorlds({ query: q, genre });

  return json({ characters: chars, worlds, genres: GENRES });
}
