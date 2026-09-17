"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { WorldCard, WorldCardData, FeaturedCard } from "@/components/cards";
import { SectionHeader, EmptyState, ErrorState, CardSkeleton, FilterChip } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";

const GENRES = [
  "Fantasy", "Dark Fantasy", "Romance", "Sci-Fi", "Cyberpunk", "Horror",
  "Mystery", "Adventure", "Slice of Life", "Comedy", "Action", "RPG",
  "Isekai", "Supernatural", "Historical",
];

export default function WorldsPage() {
  usePageMeta("Worlds", 'Explore persistent worlds built by the community.');
  const [worlds, setWorlds] = useState<WorldCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");

  const fetchWorlds = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (genre) sp.set("genre", genre);
      const d = await apiFetch<{ worlds: WorldCardData[] }>(`/api/worlds?${sp.toString()}`);
      setWorlds(d.worlds);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [q, genre]);

  useEffect(() => {
    const t = setTimeout(fetchWorlds, 250);
    return () => clearTimeout(t);
  }, [fetchWorlds]);

  const featured = useMemo(() => worlds[0], [worlds]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="pt-8 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Worlds</h1>
            <p className="text-text-dim mt-1.5 text-sm md:text-base max-w-xl">
              Persistent universes with their own lore, factions, and rules.
            </p>
          </div>
          <Link href="/create" className="btn-primary shrink-0">
            <Icon name="plus" className="w-4 h-4" /> Create a world
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-xl relative mb-6">
          <Icon name="search" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            className="input pl-12 py-3 text-base rounded-2xl"
            placeholder="Search worlds..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search worlds"
          />
        </div>

        {error ? (
          <ErrorState onRetry={fetchWorlds} />
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} aspect="aspect-[16/10]" />
            ))}
          </div>
        ) : worlds.length === 0 ? (
          <EmptyState
            icon="globe"
            title="No worlds found"
            description="Nothing here yet. Be the first to create a world."
            action={{ label: "Create a World", href: "/create" }}
          />
        ) : (
          <>
            {/* Featured world */}
            {featured && !q && (
              <section className="mb-10">
                <SectionHeader title="Featured world" icon="sparkle" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <FeaturedCard
                      item={{
                        id: featured.id,
                        type: "world",
                        name: featured.name,
                        image: featured.artwork,
                        description: featured.description,
                        creator: featured.creator,
                        meta: "Featured World",
                        tags: featured.genre ? [featured.genre] : [],
                      }}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col justify-center">
                    <div className="card p-6">
                      <div className="text-xs font-semibold uppercase tracking-widest text-text-faint mb-3">
                        About this world
                      </div>
                      <p className="text-sm text-text-dim leading-relaxed">
                        {featured.description || "A world waiting to be explored."}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-5">
                        {featured.genre && <span className="chip">{featured.genre}</span>}
                        {featured.characterCount != null && (
                          <span className="chip">
                            {featured.characterCount} characters
                          </span>
                        )}
                      </div>
                      <Link href={`/worlds/${featured.id}`} className="btn-primary mt-6 inline-flex">
                        Enter world <Icon name="arrowRight" className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Genre filter */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              <FilterChip active={!genre} onClick={() => setGenre("")}>
                All
              </FilterChip>
              {GENRES.slice(0, 8).map((g) => (
                <FilterChip key={g} active={genre === g} onClick={() => setGenre(genre === g ? "" : g)}>
                  {g}
                </FilterChip>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {worlds.map((w) => (
                <WorldCard key={w.id} world={w} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
