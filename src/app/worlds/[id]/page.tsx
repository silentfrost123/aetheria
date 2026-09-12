"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/icons";

export default function WorldProfile() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [world, setWorld] = useState<any>(null);
  const [lore, setLore] = useState<any[]>([]);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    apiFetch<{ world: any; lore: any[] }>(`/api/worlds/${params.id}`)
      .then((d) => {
        setWorld(d.world);
        setLore(d.lore || []);
      })
      .catch(() => setWorld(null));
  }, [params.id]);

  async function enter() {
    if (!user) return router.push("/auth");
    setEntering(true);
    try {
      const d = await apiFetch<{ conversation: { id: string } }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ worldId: world.id, mode: "story", title: world.name }),
      });
      router.push(`/chat/${d.conversation.id}`);
    } catch (e: any) {
      alert(e.message);
      setEntering(false);
    }
  }

  if (!world) {
    return <AppShell><div className="max-w-3xl mx-auto px-4 py-20 text-center text-text-dim">Loading world…</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <Link href="/worlds" className="inline-flex items-center gap-1 text-sm text-text-dim hover:text-text mb-6">
          <Icon name="back" className="w-4 h-4" /> All worlds
        </Link>

        <div className="card overflow-hidden mb-8">
          <div className="relative h-56 overflow-hidden">
            {world.artwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={world.artwork} alt={world.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent-cyan/10 flex items-center justify-center text-6xl">🌍</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-6">
              <div className="text-xs text-accent-soft font-semibold uppercase tracking-wide">{world.genre}</div>
              <h1 className="font-display text-3xl font-bold">{world.name}</h1>
            </div>
          </div>
          <div className="p-6">
            <p className="text-text-dim leading-relaxed mb-6">{world.description}</p>
            <button onClick={enter} disabled={entering} className="btn-primary">
              {entering ? "Entering…" : "⚔️ Enter World"}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-display text-lg font-bold mb-4">The world</h2>
            <div className="space-y-4 text-sm">
              {world.timeline && <Field label="Timeline" value={world.timeline} />}
              {world.magicSystem && <Field label="Magic system" value={world.magicSystem} />}
              {world.technology && <Field label="Technology" value={world.technology} />}
              {world.politics && <Field label="Politics" value={world.politics} />}
              {world.history && <Field label="History" value={world.history} />}
              {world.rules && <Field label="Rules" value={world.rules} />}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg font-bold mb-4">Lore</h2>
            {lore.length === 0 ? (
              <p className="text-sm text-text-faint">No lore entries yet.</p>
            ) : (
              <div className="space-y-4">
                {lore.map((l) => (
                  <div key={l.id} className="border-b border-border-soft pb-3 last:border-0">
                    <div className="font-semibold text-sm">{l.name}</div>
                    <p className="text-xs text-text-dim mt-1">{l.content}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {l.keywords.map((k: string) => (
                        <span key={k} className="text-[10px] text-text-faint bg-bg-card px-1.5 py-0.5 rounded">{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-faint uppercase tracking-wide mb-1">{label}</div>
      <div className="text-text-dim leading-relaxed">{value}</div>
    </div>
  );
}
