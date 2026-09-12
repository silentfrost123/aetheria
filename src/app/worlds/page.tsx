"use client";

import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { WorldCard } from "@/components/cards";
import { apiFetch } from "@/lib/api";

export default function WorldsPage() {
  const [worlds, setWorlds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ worlds: any[] }>("/api/worlds").then((d) => setWorlds(d.worlds)).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <PageHeader title="Worlds" subtitle="Persistent universes with their own lore, factions, and rules." />
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer rounded-2xl h-44" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {worlds.map((w) => (
              <WorldCard key={w.id} world={w} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
