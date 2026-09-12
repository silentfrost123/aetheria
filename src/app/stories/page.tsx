"use client";

import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CharacterCard, CharacterCardData } from "@/components/cards";
import { apiFetch } from "@/lib/api";

export default function StoriesPage() {
  const [stories, setStories] = useState<CharacterCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ characters: any[] }>("/api/characters?sort=popular")
      .then((d) => {
        // Story-mode experiences are characters tagged with story mode
        const s = d.characters.filter(
          (c) => c.tags?.some((t: string) => t.toLowerCase().includes("story"))
        );
        setStories(s.length ? s : d.characters.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <PageHeader
          title="Stories"
          subtitle="Interactive narratives where the AI is your narrator, Game Master, and every NPC."
        />
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer rounded-2xl h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stories.map((c) => (
              <CharacterCard key={c.id} char={c} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
