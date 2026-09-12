"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { CharacterCard, CharacterCardData } from "@/components/cards";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";

interface CharacterFull {
  id: string;
  name: string;
  avatar?: string;
  banner?: string;
  age?: string;
  gender?: string;
  species?: string;
  occupation?: string;
  tags: string[];
  shortDescription: string;
  publicDescription: string;
  isPublic: boolean;
  allowRemix: boolean;
  personality?: Record<string, number>;
  definition?: any;
  creator: { id: string; username: string };
  stats: { chats?: number; likes?: number; favorites?: number };
  worldId?: string | null;
}

export default function CharacterProfile() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [char, setChar] = useState<CharacterFull | null>(null);
  const [similar, setSimilar] = useState<CharacterCardData[]>([]);
  const [tab, setTab] = useState<"about" | "personality" | "creator">("about");
  const [starting, setStarting] = useState(false);
  const [faved, setFaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch<{ character: CharacterFull }>(`/api/characters/${params.id}`)
      .then((d) => setChar(d.character))
      .catch(() => setChar(null));
    apiFetch<{ characters: CharacterCardData[] }>("/api/characters?sort=trending")
      .then((d) => setSimilar(d.characters.filter((c) => c.id !== params.id).slice(0, 4)));
  }, [params.id]);

  async function startChat() {
    if (!char) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    setStarting(true);
    try {
      const d = await apiFetch<{ conversation: { id: string } }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ characterId: char.id, worldId: char.worldId }),
      });
      router.push(`/chat/${d.conversation.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setStarting(false);
    }
  }

  if (!char) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="shimmer rounded-2xl h-80 mb-6" />
          <p className="text-text-dim">Loading character…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <Link href="/discover" className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-text mb-6">
          <Icon name="back" className="w-4 h-4" /> Back
        </Link>

        {/* Hero */}
        <div className="card overflow-hidden mb-6">
          <div className="relative">
            <div className="h-44 md:h-56 bg-gradient-to-br from-accent/20 via-bg-card to-accent-cyan/10 overflow-hidden">
              {char.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={char.avatar} alt="" className="w-full h-full object-cover object-top blur-sm scale-110 opacity-40" />
              )}
            </div>
            <div className="px-6 pb-6 -mt-16 relative">
              <div className="flex items-end gap-4">
                <Avatar src={char.avatar} name={char.name} className="w-28 h-28 rounded-3xl border-4 border-bg-soft shadow-card" />
                <div className="flex-1 min-w-0 pt-16">
                  <h1 className="font-display text-3xl font-bold leading-tight">{char.name}</h1>
                  <p className="text-sm text-text-dim">
                    {char.species} · {char.gender} · @{char.creator.username}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {char.tags.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
              <p className="text-text-dim mt-4 leading-relaxed">{char.shortDescription}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={startChat} disabled={starting} className="btn-primary flex items-center gap-2">
                  <Icon name="chat" className="w-4 h-4" />
                  {starting ? "Starting…" : "Chat now"}
                </button>
                <button onClick={() => setFaved((f) => !f)} className="btn-ghost flex items-center gap-2">
                  <Icon name={faved ? "heartFilled" : "heart"} className="w-4 h-4 text-accent-pink" />
                  {faved ? "Favorited" : "Favorite"}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="btn-ghost"
                >
                  {copied ? "Copied!" : "Share"}
                </button>
                {char.allowRemix && user && (
                  <button
                    onClick={async () => {
                      try {
                        const d = await apiFetch<{ character: { id: string } }>(
                          `/api/characters/${char.id}/remix`,
                          { method: "POST" }
                        );
                        router.push(`/create?remix=${d.character.id}`);
                      } catch (e: any) {
                        alert(e.message);
                      }
                    }}
                    className="btn-ghost flex items-center gap-2"
                  >
                    <Icon name="branch" className="w-4 h-4" /> Remix
                  </button>
                )}
              </div>
              <div className="mt-4 flex gap-6 text-sm text-text-faint">
                <span>💬 {(char.stats.chats || 0).toLocaleString()} chats</span>
                <span>❤️ {(char.stats.likes || 0).toLocaleString()} likes</span>
                <span>⭐ {(char.stats.favorites || 0).toLocaleString()} favorites</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["about", "personality", "creator"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-accent/15 border border-accent/40 text-accent-soft" : "border border-border text-text-dim hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="card p-6">
          {tab === "about" && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold">About</h3>
              <p className="text-text-dim leading-relaxed whitespace-pre-wrap">{char.publicDescription}</p>
              {(char.age || char.occupation) && (
                <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                  {char.age && <div><span className="text-text-faint">Age</span><div className="text-text">{char.age}</div></div>}
                  {char.occupation && <div><span className="text-text-faint">Occupation</span><div className="text-text">{char.occupation}</div></div>}
                </div>
              )}
            </div>
          )}
          {tab === "personality" && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold">Personality profile</h3>
              {char.personality && Object.keys(char.personality).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(char.personality).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-text-dim capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                      <div className="flex-1 h-2 rounded-full bg-bg-card overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-pink" style={{ width: `${Math.round((v as number) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-text-faint w-8 text-right">{Math.round((v as number) * 100)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-dim text-sm">This character has no public personality profile.</p>
              )}
            </div>
          )}
          {tab === "creator" && (
            <div className="space-y-3">
              <h3 className="font-display text-lg font-bold">Creator</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center font-bold">
                  {char.creator.username[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">@{char.creator.username}</div>
                  <div className="text-xs text-text-faint">Creator</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-bold mb-4">Similar characters</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map((c) => (
                <CharacterCard key={c.id} char={c} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
