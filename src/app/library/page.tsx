"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CharacterCard, CharacterCardData } from "@/components/cards";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LibraryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chars, setChars] = useState<CharacterCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    apiFetch<{ characters: CharacterCardData[] }>("/api/characters?mine=1")
      .then((d) => setChars(d.characters))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <PageHeader
          title="Library"
          subtitle="The characters and creations you've made."
          action={<Link href="/create" className="btn-primary">Create new</Link>}
        />
        {!user ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-text-dim mb-4">Your library is empty until you sign in.</p>
            <button className="btn-primary" onClick={() => router.push("/auth")}>Sign in</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer rounded-2xl h-64" />
            ))}
          </div>
        ) : chars.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-text-dim mb-1">Your next story hasn't been written yet.</p>
            <Link href="/create" className="text-accent-soft hover:underline text-sm">Create your first character →</Link>
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
