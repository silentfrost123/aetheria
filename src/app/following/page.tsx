"use client";

import { AppShell } from "@/components/AppShell";
import { usePageMeta } from "@/lib/page-meta";
import { EmptyState } from "@/components/ui";

export default function FollowingPage() {
  usePageMeta("Following", 'Creators and characters you follow.');
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Following</h1>
        <p className="text-text-dim text-sm">Creators and creations you&apos;re keeping up with.</p>
        <div className="mt-6">
          <EmptyState
            icon="following"
            title="You're not following anyone yet"
            description="Follow creators to see their new characters, worlds, and stories here."
            action={{ label: "Explore creators", href: "/discover" }}
          />
        </div>
      </div>
    </AppShell>
  );
}
