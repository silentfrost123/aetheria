"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { CharacterCard, WorldCard, CharacterCardData } from "@/components/cards";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";

interface DiscoverData {
  characters: CharacterCardData[];
  worlds: any[];
  genres: string[];
}

const SORTS = [
  { id: "trending", label: "Trending" },
  { id: "popular", label: "Most popular" },
  { id: "recent", label: "Recently created" },
];

export default function Discover() {
  const [data, setData] = useState<DiscoverData | null>(null);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string>("");
  const [sort, setSort] = useState("trending");
  const [tab, setTab] = useState<"characters" | "worlds">("characters");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setGenre(sp.get("genre") || "");
    setSort(sp.get("sort") || "trending");
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (genre) sp.set("genre", genre);
    sp.set("sort", sort);
    const res = await apiFetch<DiscoverData>(`/api/discover?${sp.toString()}`);
    setData(res);
    setLoading(false);
  }, [q, genre, sort]);

  useEffect(() => {
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [fetchData]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">Discover</h1>
          <p className="text-text-dim mt-1 text-sm">
            Find characters, worlds, and stories to step into.
          </p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <Icon name="discover" className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              className="input pl-11"
              placeholder="Search characters, creators, worlds, tags…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  sort === s.id
                    ? "bg-accent/15 border-accent/40 text-accent-soft"
                    : "border-border text-text-dim hover:text-text"
                }`}
              >
                {s.label}
              </button>
            ))}
            <span className="text-border mx-1">|</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setGenre("")}
                className={`chip ${!genre ? "bg-accent/25" : ""}`}
              >
                All
              </button>
              {(data?.genres || []).slice(0, 8).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(genre === g ? "" : g)}
                  className={`chip ${genre === g ? "bg-accent/25" : ""}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {(["characters", "worlds"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-accent/15 border border-accent/40 text-accent-soft"
                    : "border border-border text-text-dim hover:text-text"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer rounded-2xl h-64" />
            ))}
          </div>
        ) : tab === "characters" ? (
          <>
            <div className="text-sm text-text-faint mb-4">
              {data?.characters.length || 0} characters
            </div>
            {data?.characters.length ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.characters.map((c) => (
                  <CharacterCard key={c.id} char={c} />
                ))}
              </div>
            ) : (
              <EmptyState onClear={() => setQ("")} />
            )}
          </>
        ) : (
          <>
            <div className="text-sm text-text-faint mb-4">
              {data?.worlds.length || 0} worlds
            </div>
            {data?.worlds.length ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.worlds.map((w) => (
                  <WorldCard key={w.id} world={w} />
                ))}
              </div>
            ) : (
              <EmptyState onClear={() => setQ("")} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="font-display text-xl font-semibold">Nothing found</h3>
      <p className="text-text-dim text-sm mt-2">
        Try a different search, or clear your filters.
      </p>
      <button onClick={onClear} className="btn-ghost mt-4">
        Clear search
      </button>
    </div>
  );
}
