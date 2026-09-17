"use client";

import { useEffect, useState } from "react";
import { usePageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StoryCard, StoryCardData, FeaturedCard } from "@/components/cards";
import { SectionHeader, EmptyState, ErrorState, CardSkeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";

interface StoriesData {
  stories: StoryCardData[];
  counts: { stories: number };
}

export default function StoriesPage() {
  usePageMeta("Stories", 'Interactive stories from the Chatworld community.');
  const [stories, setStories] = useState<StoryCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    apiFetch<StoriesData>("/api/discover")
      .then((d) => setStories(d.stories || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const featured = stories[0];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="pt-8 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Stories</h1>
            <p className="text-text-dim mt-1.5 text-sm md:text-base max-w-xl">
              Interactive narratives where the AI is your narrator, Game Master, and every NPC.
            </p>
          </div>
          <Link href="/create" className="btn-primary shrink-0">
            <Icon name="plus" className="w-4 h-4" /> Create a story
          </Link>
        </div>

        {error ? (
          <ErrorState onRetry={load} />
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} aspect="aspect-[16/10]" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <EmptyState
            icon="book"
            title="No stories found"
            description="Every great adventure starts with a blank page."
            action={{ label: "Create a Story", href: "/create" }}
          />
        ) : (
          <>
            {/* Featured story */}
            {featured && (
              <section className="mb-10">
                <SectionHeader title="Featured story" icon="sparkle" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <FeaturedCard
                      item={{
                        id: featured.id,
                        type: "story",
                        name: featured.title,
                        image: featured.cover,
                        description: featured.description,
                        creator: featured.creator,
                        meta: "Featured Story",
                        tags: featured.genre ? [featured.genre] : [],
                        stats: featured.stats,
                      }}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col justify-center">
                    <div className="card p-6">
                      <div className="text-xs font-semibold uppercase tracking-widest text-text-faint mb-3">
                        Live adventure
                      </div>
                      <p className="text-sm text-text-dim leading-relaxed">
                        {featured.description || "Step into a branching story."}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-5">
                        {featured.genre && <span className="chip">{featured.genre}</span>}
                        <span className="chip">
                          <Icon name="play" className="w-3 h-3" />
                          {featured.stats?.chats ?? 0} plays
                        </span>
                      </div>
                      <Link href={`/characters/${featured.id}`} className="btn-primary mt-6 inline-flex">
                        Begin story <Icon name="arrowRight" className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* All stories */}
            <SectionHeader title="All stories" subtitle="Interactive worlds to step into" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
