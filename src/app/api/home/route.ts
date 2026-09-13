import { json, requireUser } from "@/server/http";
import { db } from "@/server/db";
import { safeParse } from "@/server/util";
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
  let forYou: any[] = [];
  let personalized = false;
  let onboarded = false;

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

    // ---- Personalization signals (genres chosen at onboarding + tags of
    // ---- characters the user liked/saved/chatted with).
    const rawSettings = (user as any).settings;
    const settings: Record<string, any> =
      typeof rawSettings === "string"
        ? safeParse<Record<string, any>>(rawSettings, {})
        : rawSettings && typeof rawSettings === "object"
          ? rawSettings
          : {};
    onboarded = settings.onboarded === true;
    const preferred = new Set<string>(
      (Array.isArray(settings.genres) ? settings.genres : [])
        .map((g: string) => String(g).toLowerCase())
        .filter(Boolean)
    );

    const signalRows = db
      .prepare(
        `SELECT target_id FROM likes WHERE user_id = ? AND target_type = 'character'
         UNION
         SELECT target_id FROM bookmarks WHERE user_id = ? AND target_type = 'character'`
      )
      .all(user.id, user.id) as { target_id: string }[];
    const chattedIds = continuePlaying
      .map((c) => c.character?.id)
      .filter(Boolean) as string[];

    for (const id of [...signalRows.map((r) => r.target_id), ...chattedIds]) {
      const ch = getCharacter(id);
      if (ch?.tags) for (const t of ch.tags) preferred.add(String(t).toLowerCase());
    }

    if (preferred.size > 0) {
      const chatted = new Set(chattedIds);
      forYou = listCharacters({ sort: "popular" })
        .filter((c: any) => !chatted.has(c.id))
        .map((c: any) => {
          const tags: string[] = c.tags || [];
          const overlap = tags.reduce(
            (n, t) => n + (preferred.has(String(t).toLowerCase()) ? 1 : 0),
            0
          );
          return { c, overlap };
        })
        .filter((x: any) => x.overlap > 0)
        .sort(
          (a: any, b: any) =>
            b.overlap - a.overlap || (b.c.stats?.chats || 0) - (a.c.stats?.chats || 0)
        )
        .slice(0, 8)
        .map((x: any) => x.c);
      personalized = forYou.length > 0;
    }
  }

  // ---- Interactive stories (public) ----
  const stories = (
    db
      .prepare(
        `SELECT s.*, u.username AS creator_username
         FROM stories s LEFT JOIN users u ON u.id = s.creator_id
         WHERE s.is_public = 1
         ORDER BY s.created_at DESC LIMIT 6`
      )
      .all() as any[]
  ).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    genre: s.genre,
    cover: s.cover,
    creator: { id: s.creator_id, username: s.creator_username },
  }));

  // ---- Popular creators (by total chats across their public characters) ----
  const byCreator = new Map<string, { characters: number; chats: number }>();
  for (const c of listCharacters({ sort: "popular" }) as any[]) {
    if (!c.creatorId) continue;
    const e = byCreator.get(c.creatorId) || { characters: 0, chats: 0 };
    e.characters += 1;
    e.chats += Number(c.stats?.chats) || 0;
    byCreator.set(c.creatorId, e);
  }
  const creators = [...byCreator.entries()]
    .sort((a, b) => b[1].chats - a[1].chats)
    .slice(0, 6)
    .map(([id, e]) => ({ id, username: getCreatorUsername(id), ...e }));

  return json({
    featured: featured ? toCard(featured) : null,
    recommended: recommended.map(toCard),
    trending: trending.map(toCard),
    recentlyCreated: recentlyCreated.map(toCard),
    forYou: forYou.map(toCard),
    personalized,
    onboarded,
    hasHistory: continuePlaying.length > 0,
    stories,
    creators,
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
