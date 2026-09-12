"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ContinueCard } from "@/components/cards";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ChatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ conversations: any[] }>("/api/conversations")
      .then((d) => setConvs(d.conversations))
      .finally(() => setLoading(false));
  }, [user]);

  async function newStory() {
    const d = await apiFetch<{ conversation: { id: string } }>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ mode: "story", title: "New story" }),
    });
    router.push(`/chat/${d.conversation.id}`);
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <PageHeader
          title="Your chats"
          subtitle="Every conversation, every world, every story you've stepped into."
          action={
            <button onClick={newStory} className="btn-primary">New story</button>
          }
        />
        {!user ? (
          <EmptyCta onAction={() => router.push("/auth")} label="Sign in to see your chats" />
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer rounded-2xl h-20" />
            ))}
          </div>
        ) : convs.length === 0 ? (
          <EmptyCta onAction={() => router.push("/discover")} label="Every adventure starts with a first message." cta="Explore characters" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {convs.map((c) => (
              <ContinueCard key={c.id} conv={c} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyCta({ onAction, label, cta = "Sign in" }: { onAction: () => void; label: string; cta?: string }) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">💬</div>
      <p className="text-text-dim mb-4">{label}</p>
      <button onClick={onAction} className="btn-primary">{cta}</button>
    </div>
  );
}
