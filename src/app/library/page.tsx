"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CharacterCard, CharacterCardData } from "@/components/cards";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ConfirmDialog, useToast } from "@/components/ui";

export default function LibraryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chars, setChars] = useState<CharacterCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<CharacterCardData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<{ characters: CharacterCardData[] }>("/api/characters?mine=1")
      .then((d) => setChars(d.characters))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function doDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/characters/${pendingDelete.id}`, { method: "DELETE" });
      setChars((cs) => cs.filter((c) => c.id !== pendingDelete.id));
      toast(`${pendingDelete.name} deleted.`, "success");
      setPendingDelete(null);
    } catch (e: any) {
      toast(e?.message || "Couldn't delete character.", "error");
    } finally {
      setDeleting(false);
    }
  }

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
              <div key={c.id} className="space-y-2">
                <CharacterCard char={c} />
                <div className="flex gap-2">
                  <Link
                    href={`/create?remix=${c.id}`}
                    className="flex-1 text-center text-xs py-1.5 rounded-lg border border-border-soft text-text-dim hover:text-text hover:border-accent/40 transition-colors"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => setPendingDelete(c)}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-border-soft text-text-dim hover:text-danger hover:border-danger/40 transition-colors"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        busy={deleting}
        title={`Delete ${pendingDelete?.name || "this character"}?`}
        description="This permanently removes the character and its lore. This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onClose={() => setPendingDelete(null)}
      />
    </AppShell>
  );
}
