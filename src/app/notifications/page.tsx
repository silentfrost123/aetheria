"use client";

import { AppShell, PageHeader } from "@/components/AppShell";

export default function NotificationsPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <PageHeader title="Notifications" subtitle="Updates about the creators and stories you follow." />
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-text-dim">All quiet for now.</p>
        </div>
      </div>
    </AppShell>
  );
}
