"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CharacterCard, CharacterCardData } from "@/components/cards";
import { apiFetch } from "@/lib/api";

export default function CharactersPage() {
  const [chars, setChars] = useState<CharacterCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ characters: CharacterCardData[] }>("/api/characters?sort=popular")
      .then((d) => setChars(d.characters))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Characters</h1>
        <p className="text-text-dim text-sm mb-8">Personalities that remember you.</p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer rounded-2xl h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chars.map((c) => (
              <CharacterCard key={c.id} char={c} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
