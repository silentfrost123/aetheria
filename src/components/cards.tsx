"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { agoLabel } from "./time";

export interface CharacterCardData {
  id: string;
  name: string;
  avatar?: string | null;
  species?: string;
  creator?: { id: string; username: string };
  shortDescription?: string;
  tags?: string[];
  stats?: { chats?: number; likes?: number; favorites?: number };
}

function formatCount(n?: number) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

export function CharacterCard({
  char,
  compact = false,
}: {
  char: CharacterCardData;
  compact?: boolean;
}) {
  return (
    <Link href={`/characters/${char.id}`} className="group block">
      <div className="card overflow-hidden h-full">
        <div className="relative aspect-[3/4] overflow-hidden bg-bg-card">
          {char.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={char.avatar}
              alt={char.name}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-card to-bg-soft">
              <span className="text-5xl font-bold text-text-faint">{char.name[0]}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <div className="font-semibold text-white text-sm drop-shadow">{char.name}</div>
            {char.species && (
              <div className="text-[11px] text-white/70">{char.species}</div>
            )}
          </div>
        </div>
        {!compact && (
          <div className="p-3 space-y-2">
            <p className="text-xs text-text-dim line-clamp-2 leading-relaxed">
              {char.shortDescription}
            </p>
            {char.tags && char.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {char.tags.slice(0, 3).map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-text-faint pt-1">
              <span>@{char.creator?.username || "unknown"}</span>
              <span className="flex items-center gap-2">
                <span>💬 {formatCount(char.stats?.chats)}</span>
                <span>❤️ {formatCount(char.stats?.likes)}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export function WorldCard({
  world,
}: {
  world: {
    id: string;
    name: string;
    description?: string;
    genre?: string;
    artwork?: string | null;
  };
}) {
  return (
    <Link href={`/worlds/${world.id}`} className="group block">
      <div className="card overflow-hidden">
        <div className="relative h-40 overflow-hidden bg-bg-card">
          {world.artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={world.artwork}
              alt={world.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-card to-bg-soft text-4xl">
              🌍
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-2 left-3">
            <div className="font-semibold text-white text-sm">{world.name}</div>
            {world.genre && <div className="text-[11px] text-white/70">{world.genre}</div>}
          </div>
        </div>
        {world.description && (
          <p className="p-3 text-xs text-text-dim line-clamp-2">{world.description}</p>
        )}
      </div>
    </Link>
  );
}

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
    <Link href={`/chat/${conv.id}`} className="group block">
      <div className="card p-3 flex items-center gap-3 h-full">
        <Avatar src={img} name={name} className="w-14 h-14" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-sm truncate">{name}</div>
            {conv.lastMessageAt && (
              <div className="text-[10px] text-text-faint shrink-0">
                {agoLabel(conv.lastMessageAt)}
              </div>
            )}
          </div>
          <div className="text-xs text-text-dim truncate mt-0.5">
            {conv.lastMessage || "New story…"}
          </div>
          {conv.messageCount != null && (
            <div className="text-[10px] text-text-faint mt-1">
              {conv.messageCount} messages
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
