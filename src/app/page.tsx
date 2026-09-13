"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CharacterCard, WorldCard, ContinueCard, CharacterCardData } from "@/components/cards";
import {
  SectionHeader,
  HScroll,
  CardSkeleton,
  FilterChip,
  useToast,
  formatCount,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";

interface HomeData {
  featured: CharacterCardData | null;
  recommended: CharacterCardData[];
  trending: CharacterCardData[];
  recentlyCreated: CharacterCardData[];
  forYou: CharacterCardData[];
  personalized: boolean;
  onboarded: boolean;
  hasHistory: boolean;
  stories: {
    id: string;
    title: string;
    description: string;
    genre: string;
    cover?: string;
    creator?: { id: string; username?: string };
  }[];
  creators: { id: string; username: string; characters: number; chats: number }[];
  worlds: any[];
  continuePlaying: any[];
  genres: string[];
  isAuthed: boolean;
}

export default function Home() {
  const { user, loading, updateSettings } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [ready, setReady] = useState(false);
  const [reload, setReload] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [savingOnboard, setSavingOnboard] = useState(false);

  useEffect(() => {
    apiFetch<HomeData>("/api/home")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setReady(true));
  }, [user, reload]);

  async function finishOnboarding(genres: string[]) {
    setSavingOnboard(true);
    try {
      await updateSettings({ onboarded: true, genres });
      toast(
        genres.length
          ? "Your worlds await — recommendations tuned to your taste."
          : "Welcome to Aetheria.",
        "success"
      );
      setReload((r) => r + 1);
    } catch (e: any) {
      toast(e?.message || "Couldn't save your preferences.", "error");
    } finally {
      setSavingOnboard(false);
    }
  }

  const featured = data?.featured;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-bg-soft mt-6">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="relative grid md:grid-cols-2 gap-6 p-7 md:p-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-soft bg-accent/10 border border-accent/20 rounded-full px-3 py-1">
                <Icon name="spark" className="w-3.5 h-3.5" /> A LIVING, PERSISTENT WORLD
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
                ENTER A WORLD
                <br />
                <span className="gradient-text">THAT REMEMBERS YOU.</span>
              </h1>
              <p className="text-text-dim max-w-md leading-relaxed">
                Chat with characters who have real personalities. Build worlds with their own
                lore. Every choice matters — and nothing is ever forgotten.
              </p>
              <div className="flex flex-wrap gap-3">
                {featured && (
                  <button onClick={() => router.push(`/characters/${featured.id}`)} className="btn-primary">
                    <Icon name="play" className="w-4 h-4" /> Start Story
                  </button>
                )}
                <Link href="/discover" className="btn-ghost">
                  Explore Characters
                </Link>
              </div>
              {featured && (
                <div className="text-xs text-text-faint">
                  Featured: <span className="text-text-dim">{featured.name}</span> · @
                  {featured.creator?.username}
                </div>
              )}
            </div>
            {featured && (
              <Link
                href={`/characters/${featured.id}`}
                className="relative h-72 md:h-96 rounded-2xl overflow-hidden border border-border group"
              >
                {featured.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.avatar}
                    alt={featured.name}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-bg-card flex items-center justify-center text-7xl">
                    {featured.name[0]}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <div className="font-display text-2xl font-bold">{featured.name}</div>
                  <p className="text-sm text-white/70 line-clamp-2 mt-1">{featured.shortDescription}</p>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* First-run onboarding — pick your worlds */}
        {ready && user && data && !data.onboarded && !data.hasHistory && (
          <section className="mt-8 relative overflow-hidden rounded-3xl border border-accent/25 bg-bg-soft p-7 md:p-10">
            <div className="absolute inset-0 bg-hero-gradient opacity-70" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-soft bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
                <Icon name="compass" className="w-3.5 h-3.5" /> FIRST STEPS
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                Which worlds call to you?
              </h2>
              <p className="text-sm text-text-dim mt-2 max-w-lg leading-relaxed">
                Choose a few genres and Aetheria will guide you to characters and stories
                worth losing sleep over. You can change this anytime in Settings.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {(data.genres || []).map((g) => (
                  <FilterChip
                    key={g}
                    active={picked.includes(g)}
                    onClick={() =>
                      setPicked((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]))
                    }
                  >
                    {g}
                  </FilterChip>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  className="btn-primary"
                  disabled={savingOnboard}
                  onClick={() => finishOnboarding(picked)}
                >
                  {savingOnboard ? "Preparing…" : "Enter Aetheria"}
                </button>
                <button
                  className="btn-ghost"
                  disabled={savingOnboard}
                  onClick={() => finishOnboarding([])}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </section>
        )}

        {!ready && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Continue playing */}
        {data?.continuePlaying && data.continuePlaying.length > 0 && (
          <section className="mt-12">
            <SectionHeader
              title="Continue Playing"
              subtitle="Pick up where you left off"
              link={{ href: "/chats", label: "All chats" }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.continuePlaying.slice(0, 6).map((c) => (
                <ContinueCard key={c.id} conv={c} />
              ))}
            </div>
          </section>
        )}

        {/* For you — personalized */}
        {data?.forYou && data.forYou.length > 0 && (
          <section className="mt-12">
            <SectionHeader
              title="For you"
              subtitle="Chosen from the worlds you love"
              icon="spark"
              link={{ href: "/discover", label: "Discover more" }}
            />
            <HScroll>
              {data.forYou.map((c) => (
                <div key={c.id} className="w-40 md:w-44 shrink-0 snap-start">
                  <CharacterCard char={c} compact />
                </div>
              ))}
            </HScroll>
          </section>
        )}

        {/* Recommended */}
        {data?.recommended && data.recommended.length > 0 && (
          <section className="mt-12">
            <SectionHeader
              title={data.isAuthed ? "Recommended for you" : "Recommended"}
              subtitle="Characters the community loves right now"
              link={{ href: "/discover", label: "Discover more" }}
              icon="compass"
            />
            <HScroll>
              {data.recommended.map((c) => (
                <div key={c.id} className="w-40 md:w-44 shrink-0 snap-start">
                  <CharacterCard char={c} compact />
                </div>
              ))}
            </HScroll>
          </section>
        )}

        {/* Trending + Worlds */}
        <section className="mt-12 grid md:grid-cols-2 gap-10">
          <div>
            <SectionHeader
              title="Trending characters"
              link={{ href: "/discover?sort=popular", label: "See all" }}
              icon="fire"
            />
            <div className="grid grid-cols-2 gap-4">
              {(data?.trending || []).slice(0, 4).map((c) => (
                <CharacterCard key={c.id} char={c} />
              ))}
            </div>
          </div>
          <div>
            <SectionHeader
              title="Popular worlds"
              link={{ href: "/worlds", label: "Explore worlds" }}
              icon="globe"
            />
            <div className="grid grid-cols-1 gap-4">
              {(data?.worlds || []).slice(0, 3).map((w) => (
                <WorldCard key={w.id} world={w} />
              ))}
            </div>
          </div>
        </section>

        {/* Recently created */}
        {data?.recentlyCreated && data.recentlyCreated.length > 0 && (
          <section className="mt-12">
            <SectionHeader
              title="Recently created"
              link={{ href: "/discover?sort=recent", label: "New arrivals" }}
            />
            <HScroll>
              {data.recentlyCreated.map((c) => (
                <div key={c.id} className="w-40 md:w-44 shrink-0 snap-start">
                  <CharacterCard char={c} compact />
                </div>
              ))}
            </HScroll>
          </section>
        )}

        {/* Interactive stories */}
        {data?.stories && data.stories.length > 0 && (
          <section className="mt-12">
            <SectionHeader
              title="Interactive stories"
              subtitle="Branching adventures written by the community"
              icon="story"
              link={{ href: "/stories", label: "All stories" }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.stories.map((s) => (
                <Link
                  key={s.id}
                  href="/stories"
                  className="card card-interactive overflow-hidden group"
                >
                  <div className="relative h-32 bg-gradient-to-br from-accent/25 via-bg-card to-bg-panel">
                    {s.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.cover}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl opacity-60">
                        ✦
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {s.genre && (
                      <span className="absolute top-2.5 left-2.5 chip text-[10px] bg-black/50 backdrop-blur">
                        {s.genre}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-display font-bold truncate">{s.title}</div>
                    <p className="text-xs text-text-dim mt-1 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                    {s.creator?.username && (
                      <div className="text-[11px] text-text-faint mt-2">
                        by @{s.creator.username}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Popular creators */}
        {data?.creators && data.creators.length > 0 && (
          <section className="mt-12">
            <SectionHeader
              title="Popular creators"
              subtitle="The architects behind your favorite characters"
              icon="users"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.creators.map((c) => (
                <Link
                  key={c.id}
                  href={`/discover?q=${encodeURIComponent(c.username || "")}`}
                  className="card card-interactive p-4 text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-accent-cyan to-accent flex items-center justify-center font-bold text-white">
                    {(c.username || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="text-sm font-semibold mt-2 truncate">@{c.username}</div>
                  <div className="text-[11px] text-text-faint mt-0.5">
                    {c.characters} character{c.characters === 1 ? "" : "s"} ·{" "}
                    {formatCount(c.chats)} chats
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Genres */}
        <section className="mt-12 mb-8">
          <SectionHeader title="Browse by genre" />
          <div className="flex flex-wrap gap-2">
            {(data?.genres || []).map((g) => (
              <Link
                key={g}
                href={`/discover?genre=${encodeURIComponent(g)}`}
                className="px-4 py-2 rounded-xl border border-border bg-bg-card hover:bg-bg-hover hover:border-accent/40 transition-colors text-sm font-medium"
              >
                {g}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
