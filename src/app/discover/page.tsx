"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { usePageMeta } from "@/lib/page-meta";
import { AppShell } from "@/components/AppShell";
import {
  CharacterCard,
  WorldCard,
  StoryCard,
  FeaturedCard,
  CategoryCard,
  RankBadge,
  CharacterCardData,
  WorldCardData,
  StoryCardData,
  TypeBadge,
} from "@/components/cards";
import {
  SectionHeader,
  HScroll,
  Segmented,
  EmptyState,
  ErrorState,
  CardSkeleton,
} from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type ContentType = "all" | "characters" | "worlds" | "stories";
type SortId = "trending" | "popular" | "recent" | "active";

interface DiscoverData {
  featured: any[];
  trending: CharacterCardData[];
  newRising: CharacterCardData[];
  recommended: CharacterCardData[];
  recReason: string;
  characters: CharacterCardData[];
  worlds: WorldCardData[];
  stories: StoryCardData[];
  results: any[];
  genres: string[];
  counts: { characters: number; worlds: number; stories: number };
}

const SORTS: { id: SortId; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "popular", label: "Popular" },
  { id: "recent", label: "New" },
  { id: "active", label: "Recently active" },
];

const POPULAR_SEARCHES = [
  "Elena",
  "Dark fantasy",
  "Cyberpunk",
  "Vampire",
  "Knight",
  "RPG",
];

/* Recent searches (safe localStorage) */
function readRecent(): string[] {
  try {
    const s = localStorage.getItem("chatworld_recent_searches");
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}
function writeRecent(terms: string[]) {
  try {
    localStorage.setItem("chatworld_recent_searches", JSON.stringify(terms.slice(0, 6)));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Search bar with autocomplete                                        */
/* ------------------------------------------------------------------ */
function SearchBar({
  q,
  onQ,
  onSubmit,
  suggestions,
  onPick,
}: {
  q: string;
  onQ: (v: string) => void;
  onSubmit: (v: string) => void;
  suggestions: { type: string; name: string; sub?: string }[];
  onPick: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(readRecent());
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const showSuggestions = focused && suggestions.length > 0;
  const showDefaults = focused && q.trim() === "";

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <Icon
          name="search"
          className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-faint"
        />
        <input
          className="input pl-12 pr-12 py-3.5 text-base rounded-2xl bg-bg-panel/80 backdrop-blur border-border shadow-card"
          placeholder="Search characters, worlds, stories, creators, or tags..."
          value={q}
          onChange={(e) => onQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit(q);
            if (e.key === "Escape") setFocused(false);
          }}
          role="combobox"
          aria-expanded={showSuggestions || showDefaults}
          aria-label="Search Chatworld"
        />
        {q && (
          <button
            onClick={() => onQ("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 btn-icon !w-7 !h-7"
            aria-label="Clear search"
          >
            <Icon name="close" className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {(showSuggestions || showDefaults) && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl glass overflow-hidden shadow-card-hover animate-scale-in">
          {showSuggestions && (
            <ul className="py-1.5">
              {suggestions.slice(0, 7).map((s, i) => (
                <li key={i}>
                  <button
                    onClick={() => onPick(s.name)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    <TypeBadge type={s.type as any} />
                    <span className="text-sm text-text truncate">{s.name}</span>
                    {s.sub && <span className="text-xs text-text-faint truncate">{s.sub}</span>}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => onSubmit(q)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-accent-soft hover:bg-white/5 transition-colors text-sm"
                >
                  <Icon name="search" className="w-4 h-4" />
                  Search for &ldquo;{q}&rdquo;
                </button>
              </li>
            </ul>
          )}
          {showDefaults && (
            <div className="py-3">
              {recent.length > 0 && (
                <div className="px-4 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-2">
                    Recent
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => onPick(r)}
                        className="chip hover:bg-accent/20 transition-colors"
                      >
                        <Icon name="clock" className="w-3 h-3" />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="px-4 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-2">
                  Popular
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((p) => (
                    <button
                      key={p}
                      onClick={() => onPick(p)}
                      className="tag hover:border-accent/40 hover:text-accent-soft transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filters modal                                                       */
/* ------------------------------------------------------------------ */
function FiltersModal({
  open,
  onClose,
  genre,
  setGenre,
  sort,
  setSort,
}: {
  open: boolean;
  onClose: () => void;
  genre: string;
  setGenre: (g: string) => void;
  sort: SortId;
  setSort: (s: SortId) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md glass rounded-t-3xl md:rounded-3xl p-6 animate-scale-in shadow-card-hover">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold">Filters</h3>
          <button onClick={onClose} className="btn-icon" aria-label="Close filters">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="label">Sort by</div>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </div>

          <div>
            <div className="label">Genre</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setGenre("")}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  !genre ? "bg-accent/15 border-accent/40 text-accent-soft" : "border-border text-text-dim hover:text-text"
                }`}
              >
                All
              </button>
              {GENRES_FULL.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(genre === g ? "" : g)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    genre === g
                      ? "bg-accent/15 border-accent/40 text-accent-soft"
                      : "border-border text-text-dim hover:text-text"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const GENRES_FULL = [
  "Fantasy", "Dark Fantasy", "Romance", "Sci-Fi", "Cyberpunk", "Horror",
  "Mystery", "Adventure", "Slice of Life", "Comedy", "Action", "RPG",
  "Isekai", "Supernatural", "Historical",
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Discover() {
  usePageMeta("Discover", 'Browse trending AI characters, worlds and interactive stories on Chatworld.');
  const { user } = useAuth();
  const [data, setData] = useState<DiscoverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState<SortId>("trending");
  const [tab, setTab] = useState<ContentType>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const sp = new URLSearchParams();
      if (submittedQ) sp.set("q", submittedQ);
      if (genre) sp.set("genre", genre);
      sp.set("sort", sort);
      const res = await apiFetch<DiscoverData>(`/api/discover?${sp.toString()}`);
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [submittedQ, genre, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced live suggestions
  const [suggestData, setSuggestData] = useState<any[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim()) {
        setSuggestData([]);
        return;
      }
      apiFetch<DiscoverData>(`/api/discover?q=${encodeURIComponent(q)}`)
        .then((d) => setSuggestData(d.results || []))
        .catch(() => setSuggestData([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const suggestions = useMemo(
    () =>
      (suggestData || []).slice(0, 7).map((r: any) => ({
        type: r.type,
        name: r.name || r.title,
        sub: r.type === "character" ? r.species : r.type === "world" ? r.genre : r.genre,
      })),
    [suggestData]
  );

  const submit = (term: string) => {
    const t = term.trim();
    if (t) {
      writeRecent([t, ...readRecent().filter((r) => r !== t)]);
    }
    setSubmittedQ(t);
    setQ(t);
  };

  const pickSuggestion = (term: string) => {
    submit(term);
  };

  const searching = submittedQ.trim().length > 0 || tab !== "all" || !!genre;

  const filtered = useMemo(() => {
    if (!data) return { characters: [], worlds: [], stories: [] };
    let { characters, worlds, stories } = data;
    if (tab === "characters") return { characters, worlds: [], stories: [] };
    if (tab === "worlds") return { characters: [], worlds, stories: [] };
    if (tab === "stories") return { characters: [], worlds: [], stories };
    return { characters, worlds, stories };
  }, [data, tab]);

  const totalCount =
    (filtered.characters?.length || 0) +
    (filtered.worlds?.length || 0) +
    (filtered.stories?.length || 0);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        {/* ================= Hero ================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-bg-soft mt-6">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(232, 85, 116,0.12),transparent_40%)]" />
          <div className="relative px-5 py-10 md:px-12 md:py-14 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-accent-soft bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-5">
              <Icon name="spark" className="w-3.5 h-3.5" /> THE CHATWORLD COLLECTION
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold leading-[1.08] tracking-tight">
              Discover your <span className="gradient-text">next world.</span>
            </h1>
            <p className="text-text-dim mt-4 text-sm md:text-base max-w-xl leading-relaxed">
              Meet characters, explore persistent worlds, and step into stories created by the
              Chatworld community.
            </p>
            <div className="mt-7 max-w-xl">
              <SearchBar
                q={q}
                onQ={setQ}
                onSubmit={submit}
                suggestions={suggestions}
                onPick={pickSuggestion}
              />
            </div>
          </div>
        </section>

        {/* ================= Filter bar ================= */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
            <Segmented<ContentType>
              value={tab}
              onChange={(v) => setTab(v)}
              options={[
                { id: "all", label: "All", icon: "grid" },
                { id: "characters", label: "Characters", icon: "characters" },
                { id: "worlds", label: "Worlds", icon: "globe" },
                { id: "stories", label: "Stories", icon: "book" },
              ]}
            />
            <div className="flex-1" />
            <button
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-border text-text-dim hover:text-text hover:border-text-faint transition-colors"
            >
              <Icon name="filter" className="w-4 h-4" />
              Filters
              {(genre || sort !== "trending") && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
        </div>

        {/* ================= Content ================= */}
        {error ? (
          <ErrorState onRetry={fetchData} />
        ) : loading ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : searching ? (
          /* ---- Filtered / search results view ---- */
          <div className="mt-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-bold">
                  {submittedQ
                    ? `Results for “${submittedQ}”`
                    : tab === "all"
                    ? "Everything"
                    : tab[0].toUpperCase() + tab.slice(1)}
                </h2>
                <p className="text-xs text-text-dim mt-0.5">
                  {totalCount} {totalCount === 1 ? "result" : "results"}
                  {genre ? ` · ${genre}` : ""}
                </p>
              </div>
              {searching && (
                <button
                  onClick={() => {
                    setSubmittedQ("");
                    setQ("");
                    setGenre("");
                    setTab("all");
                  }}
                  className="text-xs text-accent-soft hover:text-accent"
                >
                  Clear
                </button>
              )}
            </div>

            {totalCount === 0 ? (
              <EmptyState
                icon="search"
                title="Nothing found"
                description="Try a different search, or clear your filters to browse everything."
                action={{ label: "Clear search", onClick: () => { setSubmittedQ(""); setQ(""); setGenre(""); setTab("all"); } }}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.characters.map((c) => (
                  <CharacterCard key={c.id} char={c} />
                ))}
                {filtered.stories.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
                {filtered.worlds.map((w) => (
                  <WorldCard key={w.id} world={w} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ---- Browse view ---- */
          <>
            {/* Featured */}
            {data?.featured && data.featured.length > 0 && (
              <section className="mt-10">
                <SectionHeader
                  title="Featured"
                  subtitle="Hand-picked worlds and characters to fall into"
                  icon="sparkle"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.featured.map((f) => (
                    <FeaturedCard key={`${f.type}-${f.id}`} item={f} />
                  ))}
                </div>
              </section>
            )}

            {/* Trending */}
            {data?.trending && data.trending.length > 0 && (
              <section className="mt-12">
                <SectionHeader
                  title="🔥 Trending now"
                  subtitle="What the community is exploring right now"
                />
                <HScroll>
                  {data.trending.map((c, i) => (
                    <div key={c.id} className="w-40 md:w-44 shrink-0 snap-start">
                      <div className="relative">
                        <RankBadge rank={i + 1} />
                        <CharacterCard char={c} compact />
                      </div>
                    </div>
                  ))}
                </HScroll>
              </section>
            )}

            {/* Explore by category */}
            <section className="mt-12">
              <SectionHeader title="Explore by category" subtitle="Find your way in" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CategoryCard
                  title="Characters"
                  description="Personalities with memories, moods, and secrets of their own."
                  href="/characters"
                  icon="characters"
                  gradient="bg-gradient-to-br from-rose-700/80 to-red-900/60"
                  count={data?.counts.characters}
                />
                <CategoryCard
                  title="Worlds"
                  description="Persistent universes with lore, factions, and rules that hold."
                  href="/worlds"
                  icon="globe"
                  gradient="bg-gradient-to-br from-cyan-600/80 to-blue-700/60"
                  count={data?.counts.worlds}
                />
                <CategoryCard
                  title="Stories"
                  description="Interactive adventures where the AI is your narrator and every NPC."
                  href="/stories"
                  icon="book"
                  gradient="bg-gradient-to-br from-rose-600/80 to-orange-700/60"
                  count={data?.counts.stories}
                />
              </div>
            </section>

            {/* New & Rising */}
            {data?.newRising && data.newRising.length > 0 && (
              <section className="mt-12">
                <SectionHeader
                  title="New & rising"
                  subtitle="Freshly created, already finding their audience"
                  link={{ href: "/characters", label: "All characters" }}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.newRising.map((c) => (
                    <CharacterCard key={c.id} char={c} />
                  ))}
                </div>
              </section>
            )}

            {/* Recommended */}
            {data?.recommended && data.recommended.length > 0 && (
              <section className="mt-12">
                <SectionHeader
                  title={
                    user ? data.recReason : "Recommended for you"
                  }
                  subtitle={
                    user
                      ? "Picked from what you've been exploring"
                      : "Create an account for personal recommendations"
                  }
                  icon="compass"
                  link={user ? undefined : { href: "/auth", label: "Sign in" }}
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
          </>
        )}
      </div>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        genre={genre}
        setGenre={setGenre}
        sort={sort}
        setSort={setSort}
      />
    </AppShell>
  );
}
