"use client";

import { AppShell } from "@/components/AppShell";
import { usePageMeta } from "@/lib/page-meta";
import { EmptyState } from "@/components/ui";

export default function NotificationsPage() {
  usePageMeta("Notifications", 'Your Chatworld notifications.');
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">Notifications</h1>
        <p className="text-text-dim text-sm">Updates about the creators and stories you follow.</p>
        <div className="mt-6">
          <EmptyState
            icon="bell"
            title="All quiet for now"
            description="When creators you follow share something new, it'll show up here."
            action={{ label: "Find someone to follow", href: "/discover" }}
          />
        </div>
      </div>
    </AppShell>
  );
}
