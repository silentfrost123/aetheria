import { json, requireUser } from "@/server/http";
import { listCharacters, getCreatorUsername, getCharacter } from "@/server/services/character";
import { listWorlds } from "@/server/services/world";
import { listConversations, listMessages } from "@/server/services/chat";
import { GENRES } from "@/server/constants";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = requireUser(req);

  const featured = listCharacters({ sort: "popular" })[0];
  const recommended = listCharacters({ sort: "trending" }).slice(0, 8);
  const trending = listCharacters({ sort: "popular" }).slice(0, 8);
  const recentlyCreated = listCharacters({ sort: "recent" }).slice(0, 8);
  const worlds = listWorlds().slice(0, 6);

  const toCard = (c: any) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    species: c.species,
    creator: { id: c.creatorId, username: getCreatorUsername(c.creatorId) },
    shortDescription: c.shortDescription,
    tags: c.tags,
    stats: c.stats,
  });

  let continuePlaying: any[] = [];
  if (user) {
    continuePlaying = listConversations(user.id)
      .slice(0, 6)
      .map((c) => {
        const char = c.characterId ? getCharacter(c.characterId) : null;
        const messages = listMessages(c.id);
        const last = messages[messages.length - 1];
        return {
          id: c.id,
          title: c.title,
          character: char ? { id: char.id, name: char.name, avatar: char.avatar } : null,
          world: c.worldId ? { id: c.worldId, name: c.worldId } : null,
          lastMessage: last ? last.content.slice(0, 140) : "",
          lastMessageAt: c.lastMessageAt,
          messageCount: messages.length,
        };
      });
  }

  return json({
    featured: featured ? toCard(featured) : null,
    recommended: recommended.map(toCard),
    trending: trending.map(toCard),
    recentlyCreated: recentlyCreated.map(toCard),
    worlds: worlds.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      genre: w.genre,
      artwork: w.artwork,
    })),
    continuePlaying,
    genres: GENRES,
    isAuthed: !!user,
  });
}
