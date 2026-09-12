"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CharacterCard, WorldCard, ContinueCard, CharacterCardData } from "@/components/cards";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";

interface HomeData {
  featured: CharacterCardData | null;
  recommended: CharacterCardData[];
  trending: CharacterCardData[];
  recentlyCreated: CharacterCardData[];
  worlds: any[];
  continuePlaying: any[];
  genres: string[];
  isAuthed: boolean;
}

function SectionTitle({
  title,
  subtitle,
  link,
}: {
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-text-dim mt-0.5">{subtitle}</p>}
      </div>
      {link && (
        <Link href={link.href} className="text-xs text-accent-soft hover:text-accent flex items-center gap-1">
          {link.label} <Icon name="arrowRight" className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
      {children}
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    apiFetch<HomeData>("/api/home").then(setData).catch(() => setData(null));
  }, [user]);

  const featured = data?.featured;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-bg-soft">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="relative grid md:grid-cols-2 gap-6 p-8 md:p-12 items-center">
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
                Chat with characters who have real personalities. Build worlds with their
                own lore. Every choice matters — and nothing is ever forgotten.
              </p>
              <div className="flex flex-wrap gap-3">
                {featured && (
                  <button
                    onClick={() => router.push(`/characters/${featured.id}`)}
                    className="btn-primary"
                  >
                    Start Story
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <div className="font-display text-2xl font-bold">{featured.name}</div>
                  <p className="text-sm text-white/70 line-clamp-2 mt-1">
                    {featured.shortDescription}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* Continue playing */}
        {data?.continuePlaying && data.continuePlaying.length > 0 && (
          <section className="mt-12">
            <SectionTitle
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

        {/* Recommended */}
        {data?.recommended && data.recommended.length > 0 && (
          <section className="mt-12">
            <SectionTitle
              title="Recommended for you"
              subtitle="Characters the community loves right now"
              link={{ href: "/discover", label: "Discover more" }}
            />
            <HScroll>
              {data.recommended.map((c) => (
                <div key={c.id} className="w-44 shrink-0 snap-start">
                  <CharacterCard char={c} compact />
                </div>
              ))}
            </HScroll>
          </section>
        )}

        {/* Trending + Worlds */}
        <section className="mt-12 grid md:grid-cols-2 gap-10">
          <div>
            <SectionTitle
              title="Trending characters"
              link={{ href: "/discover?sort=popular", label: "See all" }}
            />
            <div className="grid grid-cols-2 gap-4">
              {(data?.trending || []).slice(0, 4).map((c) => (
                <CharacterCard key={c.id} char={c} />
              ))}
            </div>
          </div>
          <div>
            <SectionTitle
              title="Popular worlds"
              link={{ href: "/worlds", label: "Explore worlds" }}
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
            <SectionTitle
              title="Recently created"
              link={{ href: "/discover?sort=recent", label: "New arrivals" }}
            />
            <HScroll>
              {data.recentlyCreated.map((c) => (
                <div key={c.id} className="w-44 shrink-0 snap-start">
                  <CharacterCard char={c} compact />
                </div>
              ))}
            </HScroll>
          </section>
        )}

        {/* Genres */}
        <section className="mt-12 mb-8">
          <SectionTitle title="Browse by genre" />
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
