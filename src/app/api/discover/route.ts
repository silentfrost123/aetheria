import { json, requireUser } from "@/server/http";
import {
  listCharacters,
  getCreatorUsername,
  getCharacter,
} from "@/server/services/character";
import { listWorlds } from "@/server/services/world";
import { listConversations } from "@/server/services/chat";
import { db } from "@/server/db";
import { GENRES } from "@/server/constants";

export const runtime = "nodejs";

function characterCountForWorld(worldId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM characters WHERE world_id = ?")
    .get(worldId) as any;
  return row?.n ?? 0;
}

function toCharCard(c: any) {
  return {
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    species: c.species,
    gender: c.gender,
    creator: { id: c.creatorId, username: getCreatorUsername(c.creatorId) },
    shortDescription: c.shortDescription,
    tags: c.tags,
    stats: c.stats,
  };
}

function toWorldCard(w: any) {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    genre: w.genre,
    artwork: w.artwork,
    creator: { id: w.creatorId, username: getCreatorUsername(w.creatorId) },
    characterCount: characterCountForWorld(w.id),
  };
}

function toStoryCard(c: any) {
  return {
    id: c.id,
    title: c.name,
    cover: c.avatar,
    description: c.shortDescription,
    genre: c.tags?.[0] || "Interactive",
    creator: { id: c.creatorId, username: getCreatorUsername(c.creatorId) },
    stats: c.stats,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const genre = url.searchParams.get("genre") || undefined;
  const sort = (url.searchParams.get("sort") || "trending") as any;
  const type = url.searchParams.get("type") || "all"; // all | characters | worlds | stories

  const user = requireUser(req);

  const chars = listCharacters({ query: q || undefined, genre, sort });
  const worlds = listWorlds({ query: q || undefined, genre });
  const storyChars = listCharacters({ storyOnly: true, query: q || undefined, genre });

  // Unified search results (typed)
  let results: any[] = [];
  if (q) {
    // Search creators (usernames) in addition to content
    results = [
      ...chars.map((c) => ({ type: "character", ...toCharCard(c) })),
      ...worlds.map((w) => ({ type: "world", ...toWorldCard(w) })),
      ...storyChars.map((s) => ({ type: "story", ...toStoryCard(s) })),
    ];
  }

  // Featured = top character + top world + top story
  const topChar = listCharacters({ sort: "popular" })[0];
  const topWorld = listWorlds()[0];
  const topStory = storyChars[0];

  const featured = [
    ...(topChar
      ? [{ type: "character" as const, id: topChar.id, name: topChar.name, image: topChar.avatar, description: topChar.shortDescription, creator: { id: topChar.creatorId, username: getCreatorUsername(topChar.creatorId) }, meta: "Featured Character", tags: topChar.tags, stats: topChar.stats }]
      : []),
    ...(topWorld
      ? [{ type: "world" as const, id: topWorld.id, name: topWorld.name, image: topWorld.artwork, description: topWorld.description, creator: { id: topWorld.creatorId, username: getCreatorUsername(topWorld.creatorId) }, meta: "Featured World", tags: topWorld.genre ? [topWorld.genre] : [] }]
      : []),
    ...(topStory
      ? [{ type: "story" as const, id: topStory.id, name: topStory.name, image: topStory.avatar, description: topStory.shortDescription, creator: { id: topStory.creatorId, username: getCreatorUsername(topStory.creatorId) }, meta: "Featured Story", tags: topStory.tags, stats: topStory.stats }]
      : []),
  ].slice(0, 3);

  // Trending = ranked by combined engagement
  const trending = listCharacters({ sort: "trending" }).slice(0, 10).map(toCharCard);
  const newRising = listCharacters({ sort: "recent" }).slice(0, 8).map(toCharCard);

  // Personalised recommendation
  let recommended: any[] = [];
  let recReason = "Popular right now";
  if (user) {
    const convs = listConversations(user.id);
    const chattedIds = convs
      .map((c) => c.characterId)
      .filter(Boolean) as string[];
    if (chattedIds.length) {
      const lastChar = getCharacter(chattedIds[0]);
      if (lastChar) {
        const likedTags = lastChar.tags || [];
        const pool = listCharacters({ sort: "popular" }).filter(
          (c) => c.id !== lastChar.id
        );
        const similar = pool
          .map((c) => ({
            c,
            score: (c.tags || []).filter((t) => likedTags.includes(t)).length,
          }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((x) => x.c);
        recommended = (similar.length ? similar : pool).slice(0, 8).map(toCharCard);
        recReason = similar.length
          ? `Because you explored ${lastChar.name}`
          : "You might like";
      }
    }
  }
  if (!recommended.length) {
    recommended = listCharacters({ sort: "popular" }).slice(0, 8).map(toCharCard);
  }

  return json({
    featured,
    trending,
    newRising,
    recommended,
    recReason,
    characters: chars.map(toCharCard),
    worlds: worlds.map(toWorldCard),
    stories: storyChars.map(toStoryCard),
    results,
    genres: GENRES,
    counts: {
      characters: listCharacters().length,
      worlds: listWorlds().length,
      stories: storyChars.length,
    },
  });
}
