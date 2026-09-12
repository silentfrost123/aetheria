"use client";

import { AppShell, PageHeader } from "@/components/AppShell";

export default function FollowingPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <PageHeader title="Following" subtitle="Creators and creations you're keeping up with." />
        <div className="text-center py-20">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-text-dim">
            You're not following anyone yet. Explore Discover to find creators worth following.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
