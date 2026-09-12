"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { agoLabel } from "./time";
import { Icon } from "./icons";
import { formatCount } from "./ui";

/* ------------------------------------------------------------------ */
/* Shared types                                                        */
/* ------------------------------------------------------------------ */
export interface CharacterCardData {
  id: string;
  name: string;
  avatar?: string | null;
  species?: string;
  gender?: string;
  creator?: { id: string; username: string };
  shortDescription?: string;
  tags?: string[];
  stats?: { chats?: number; likes?: number; favorites?: number };
}

export interface WorldCardData {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  artwork?: string | null;
  creator?: { id: string; username: string };
  characterCount?: number;
}

export interface StoryCardData {
  id: string;
  title: string;
  cover?: string | null;
  description?: string;
  genre?: string;
  creator?: { id: string; username: string };
  stats?: { chats?: number; likes?: number };
}

/* ------------------------------------------------------------------ */
/* Type badge (Character / World / Story)                              */
/* ------------------------------------------------------------------ */
const TYPE_STYLES: Record<string, { label: string; cls: string; icon: string }> = {
  character: { label: "Character", cls: "bg-violet-500/85 text-white", icon: "characters" },
  world: { label: "World", cls: "bg-cyan-500/85 text-white", icon: "globe" },
  story: { label: "Story", cls: "bg-rose-500/85 text-white", icon: "book" },
};

export function TypeBadge({ type }: { type: "character" | "world" | "story" }) {
  const t = TYPE_STYLES[type] || TYPE_STYLES.character;
  return (
    <span className={`badge ${t.cls} shadow-md`}>
      <Icon name={t.icon} className="w-3 h-3" />
      {t.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Cover fallback (gradient + monogram/emoji)                          */
/* ------------------------------------------------------------------ */
function CoverFallback({ label, emoji, className = "" }: { label: string; emoji?: string; className?: string }) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-card via-bg-soft to-bg-panel ${className}`}
    >
      {emoji ? (
        <span className="text-4xl opacity-70">{emoji}</span>
      ) : (
        <span className="text-5xl font-bold text-text-faint/70">{label[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Character card                                                      */
/* ------------------------------------------------------------------ */
export function CharacterCard({
  char,
  compact = false,
}: {
  char: CharacterCardData;
  compact?: boolean;
}) {
  return (
    <Link href={`/characters/${char.id}`} className="group block h-full" aria-label={`${char.name} — character`}>
      <div className="card-interactive overflow-hidden h-full flex flex-col">
        <div className="relative aspect-[3/4] overflow-hidden bg-bg-card">
          {char.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={char.avatar}
              alt={char.name}
              className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              loading="lazy"
            />
          ) : (
            <CoverFallback label={char.name} />
          )}
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute top-2 left-2">
            <TypeBadge type="character" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="font-semibold text-white text-sm drop-shadow leading-tight">
              {char.name}
            </div>
            {char.species && (
              <div className="text-[11px] text-white/65 mt-0.5">{char.species}</div>
            )}
          </div>
        </div>

        {!compact && (
          <div className="p-3.5 space-y-2.5 flex-1 flex flex-col">
            {char.shortDescription && (
              <p className="text-xs text-text-dim line-clamp-2 leading-relaxed">
                {char.shortDescription}
              </p>
            )}
            <div className="mt-auto pt-1">
              <div className="flex items-center justify-between text-[11px] text-text-faint">
                <span className="truncate">@{char.creator?.username || "unknown"}</span>
                <span className="flex items-center gap-2.5 shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="chat" className="w-3 h-3" />
                    {formatCount(char.stats?.chats)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="heart" className="w-3 h-3" />
                    {formatCount(char.stats?.likes)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* World card                                                          */
/* ------------------------------------------------------------------ */
export function WorldCard({ world }: { world: WorldCardData }) {
  return (
    <Link href={`/worlds/${world.id}`} className="group block h-full" aria-label={`${world.name} — world`}>
      <div className="card-interactive overflow-hidden h-full flex flex-col">
        <div className="relative h-44 overflow-hidden bg-bg-card">
          {world.artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={world.artwork}
              alt={world.name}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              loading="lazy"
            />
          ) : (
            <CoverFallback label={world.name} emoji="🌍" />
          )}
          <div className="absolute top-2 left-2">
            <TypeBadge type="world" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="font-semibold text-white text-sm drop-shadow">{world.name}</div>
            {world.genre && <div className="text-[11px] text-white/65 mt-0.5">{world.genre}</div>}
          </div>
        </div>
        <div className="p-3.5 flex-1 flex flex-col">
          {world.description && (
            <p className="text-xs text-text-dim line-clamp-2 leading-relaxed">{world.description}</p>
          )}
          <div className="mt-auto pt-2 flex items-center gap-3 text-[11px] text-text-faint">
            <span className="truncate">@{world.creator?.username || "unknown"}</span>
            {world.characterCount != null && (
              <span className="inline-flex items-center gap-1 shrink-0">
                <Icon name="characters" className="w-3 h-3" />
                {world.characterCount} characters
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Story card                                                          */
/* ------------------------------------------------------------------ */
export function StoryCard({ story }: { story: StoryCardData }) {
  return (
    <Link href={`/characters/${story.id}`} className="group block h-full" aria-label={`${story.title} — story`}>
      <div className="card-interactive overflow-hidden h-full flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-bg-card">
          {story.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={story.cover}
              alt={story.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              loading="lazy"
            />
          ) : (
            <CoverFallback label={story.title} emoji="📖" />
          )}
          <div className="absolute top-2 left-2">
            <TypeBadge type="story" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="font-semibold text-white text-sm drop-shadow">{story.title}</div>
            {story.genre && <div className="text-[11px] text-white/65 mt-0.5">{story.genre}</div>}
          </div>
        </div>
        <div className="p-3.5 flex-1 flex flex-col">
          {story.description && (
            <p className="text-xs text-text-dim line-clamp-2 leading-relaxed">{story.description}</p>
          )}
          <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-text-faint">
            <span className="truncate">@{story.creator?.username || "unknown"}</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Icon name="play" className="w-3 h-3" />
              {formatCount(story.stats?.chats)} plays
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Large featured card (hero of the "Featured" section)                */
/* ------------------------------------------------------------------ */
export function FeaturedCard({
  item,
}: {
  item: {
    id: string;
    type: "character" | "world" | "story";
    name: string;
    image?: string | null;
    description?: string;
    creator?: { id: string; username: string };
    meta?: string;
    tags?: string[];
    stats?: { chats?: number; likes?: number };
  };
}) {
  const href =
    item.type === "world" ? `/worlds/${item.id}` : `/characters/${item.id}`;
  const cta = item.type === "world" ? "Enter World" : item.type === "story" ? "Begin Story" : "Meet Character";

  return (
    <Link href={href} className="group block h-full" aria-label={item.name}>
      <div className="card-interactive overflow-hidden h-full flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-bg-card">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              loading="lazy"
            />
          ) : (
            <CoverFallback label={item.name} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute top-3 left-3">
            <TypeBadge type={item.type} />
          </div>
          <div className="absolute bottom-0 inset-x-0 p-4 md:p-5">
            {item.meta && (
              <div className="text-[11px] font-semibold uppercase tracking-wider text-accent-soft mb-1">
                {item.meta}
              </div>
            )}
            <div className="font-display text-lg md:text-2xl font-bold text-white drop-shadow leading-tight">
              {item.name}
            </div>
            {item.description && (
              <p className="text-xs md:text-sm text-white/70 line-clamp-2 mt-1.5 leading-relaxed">
                {item.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-white bg-white/10 backdrop-blur border border-white/15 rounded-full px-3 py-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                {cta}
                <Icon name="arrowRight" className="w-3.5 h-3.5" />
              </span>
              {item.creator && (
                <span className="text-[11px] text-white/60">by @{item.creator.username}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Category card (Explore by category)                                 */
/* ------------------------------------------------------------------ */
export function CategoryCard({
  title,
  description,
  href,
  icon,
  gradient,
  count,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  gradient: string;
  count?: number;
}) {
  return (
    <Link href={href} className="group block h-full" aria-label={`Explore ${title}`}>
      <div className="card-interactive relative overflow-hidden p-6 h-full min-h-[10rem] flex flex-col justify-between">
        <div className={`absolute inset-0 ${gradient} opacity-90`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 backdrop-blur flex items-center justify-center mb-4">
            <Icon name={icon} className="w-5 h-5 text-white" />
          </div>
          <div className="font-display text-lg font-bold text-white">{title}</div>
          <p className="text-xs text-white/70 mt-1 leading-relaxed">{description}</p>
        </div>
        <div className="relative mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-white/80">
            {count != null ? `${formatCount(count)} ${title.toLowerCase()}` : `Explore ${title}`}
          </span>
          <Icon
            name="arrowRight"
            className="w-4 h-4 text-white/80 transition-transform duration-300 group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Continue playing card                                               */
/* ------------------------------------------------------------------ */
export function ContinueCard({
  conv,
}: {
  conv: {
    id: string;
    title: string;
    character?: { id: string; name: string; avatar?: string | null } | null;
    world?: { id: string; name: string; artwork?: string | null } | null;
    lastMessage: string;
    lastMessageAt?: string;
    messageCount?: number;
  };
}) {
  const img = conv.character?.avatar || conv.world?.artwork;
  const name = conv.character?.name || conv.world?.name || conv.title;
  return (
    <Link href={`/chat/${conv.id}`} className="group block h-full" aria-label={`Continue ${name}`}>
      <div className="card-interactive p-3.5 flex items-center gap-3.5 h-full">
        <div className="relative shrink-0">
          <Avatar src={img} name={name} className="w-14 h-14" />
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success border-2 border-bg-card" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-sm truncate">{name}</div>
            {conv.lastMessageAt && (
              <div className="text-[10px] text-text-faint shrink-0">{agoLabel(conv.lastMessageAt)}</div>
            )}
          </div>
          <div className="text-xs text-text-dim truncate mt-0.5">
            {conv.lastMessage || "New story…"}
          </div>
          {conv.messageCount != null && (
            <div className="text-[10px] text-text-faint mt-1.5 inline-flex items-center gap-1">
              <Icon name="chat" className="w-3 h-3" />
              {conv.messageCount} messages
            </div>
          )}
        </div>
        <Icon
          name="chevronRight"
          className="w-4 h-4 text-text-faint shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-text-dim"
        />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Rank badge for trending                                             */
/* ------------------------------------------------------------------ */
export function RankBadge({ rank }: { rank: number }) {
  const styles = [
    "bg-amber-400 text-black",
    "bg-slate-300 text-black",
    "bg-orange-700 text-white",
  ];
  return (
    <span
      className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shadow-lg ${
        styles[rank - 1] || "bg-black/60 text-white backdrop-blur"
      }`}
    >
      {rank}
    </span>
  );
}
