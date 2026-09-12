"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CharacterCard, CharacterCardData, FeaturedCard } from "@/components/cards";
import { SectionHeader, EmptyState, ErrorState, CardSkeleton, Segmented, FilterChip } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";

type SortId = "popular" | "trending" | "recent";

const GENRES = [
  "Fantasy", "Dark Fantasy", "Romance", "Sci-Fi", "Cyberpunk", "Horror",
  "Mystery", "Adventure", "Slice of Life", "Comedy", "Action", "RPG",
  "Isekai", "Supernatural", "Historical",
];

export default function CharactersPage() {
  const [chars, setChars] = useState<CharacterCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState<SortId>("popular");

  const fetchChars = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (genre) sp.set("genre", genre);
      sp.set("sort", sort);
      const d = await apiFetch<{ characters: CharacterCardData[] }>(
        `/api/characters?${sp.toString()}`
      );
      setChars(d.characters);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [q, genre, sort]);

  useEffect(() => {
    const t = setTimeout(fetchChars, 250);
    return () => clearTimeout(t);
  }, [fetchChars]);

  const featured = useMemo(() => (chars[0] ? [chars[0]] : []), [chars]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        {/* Header + search */}
        <div className="pt-8 pb-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Characters
          </h1>
          <p className="text-text-dim mt-1.5 text-sm md:text-base max-w-xl">
            Personalities with their own memories, moods, and secrets — waiting to meet you.
          </p>
          <div className="mt-6 max-w-xl relative">
            <Icon name="search" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              className="input pl-12 py-3 text-base rounded-2xl"
              placeholder="Search characters, creators, or tags..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search characters"
            />
          </div>
        </div>

        {error ? (
          <ErrorState onRetry={fetchChars} />
        ) : loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Featured (top result as a large card) */}
            {featured.length > 0 && !q && !genre && (
              <section className="mb-10">
                <SectionHeader title="Featured character" icon="sparkle" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <FeaturedCard
                      item={{
                        id: featured[0].id,
                        type: "character",
                        name: featured[0].name,
                        image: featured[0].avatar,
                        description: featured[0].shortDescription,
                        creator: featured[0].creator,
                        meta: "Most popular",
                        tags: featured[0].tags,
                        stats: featured[0].stats,
                      }}
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {chars.slice(1, 4).map((c) => (
                      <CharacterCard key={c.id} char={c} compact />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Segmented<SortId>
                value={sort}
                onChange={setSort}
                size="sm"
                options={[
                  { id: "popular", label: "Popular" },
                  { id: "trending", label: "Trending" },
                  { id: "recent", label: "New" },
                ]}
              />
              <div className="flex-1" />
              <div className="flex flex-wrap gap-1.5 max-w-full">
                <FilterChip active={!genre} onClick={() => setGenre("")}>
                  All
                </FilterChip>
                {GENRES.slice(0, 8).map((g) => (
                  <FilterChip key={g} active={genre === g} onClick={() => setGenre(genre === g ? "" : g)}>
                    {g}
                  </FilterChip>
                ))}
              </div>
            </div>

            {/* Grid */}
            {chars.length === 0 ? (
              <EmptyState
                icon="characters"
                title="No characters found"
                description="Your next favorite character might be hiding somewhere else."
                action={{ label: "Clear filters", onClick: () => { setQ(""); setGenre(""); } }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {chars.map((c) => (
                  <CharacterCard key={c.id} char={c} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
