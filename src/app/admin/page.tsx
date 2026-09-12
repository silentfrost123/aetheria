"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";
import { formatCount } from "@/components/ui";

interface AdminStats {
  users: number;
  characters: number;
  worlds: number;
  conversations: number;
  messages: number;
  memories: number;
  pointsInCirculation: number;
  totalTransactions: number;
  admins: number;
  banned: number;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  plan: string;
  isAdmin: boolean;
  banned: boolean;
  ageVerified: boolean;
  createdAt: string;
  balance: number;
  messageCount: number;
  conversationCount: number;
}

interface AuditRow {
  id: string;
  adminUsername: string;
  targetUsername: string | null;
  action: string;
  detail: string;
  createdAt: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Code generator state
  const [codeAmount, setCodeAmount] = useState("1000");
  const [codeCount, setCodeCount] = useState("1");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  const isAdmin = !!user?.isAdmin;

  const loadStats = useMemo(
    () => async () => {
      try {
        const d = await apiFetch<{ stats: AdminStats; audit: AuditRow[] }>("/api/admin/stats");
        setStats(d.stats);
        setAudit(d.audit);
      } catch {
        /* ignore */
      }
    },
    []
  );

  const loadUsers = useMemo(
    () => async (q?: string) => {
      try {
        const d = await apiFetch<{ users: AdminUser[] }>(
          `/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`
        );
        setUsers(d.users);
      } catch {
        /* ignore */
      }
    },
    []
  );

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
      return;
    }
    if (isAdmin) {
      loadStats();
      loadUsers();
    }
  }, [loading, isAdmin, router, loadStats, loadUsers]);

  if (loading) return <AppShell><div className="p-8 text-text-dim">Loading…</div></AppShell>;

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <p className="text-text-dim">You don&apos;t have permission to view this page.</p>
        </div>
      </AppShell>
    );
  }

  async function act(userId: string, action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch<any>(`/api/admin/users/${userId}`, {
        method: "POST",
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.error) setError(res.error);
      else setNotice(`Done — ${action} on user.`);
      await loadUsers(query);
      await loadStats();
    } catch (e: any) {
      setError(e?.message || "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function createCodes() {
    setBusy(true);
    setError(null);
    setNotice(null);
    setGeneratedCodes([]);
    try {
      const res = await apiFetch<{ codes: string[]; amount: number }>("/api/admin/codes", {
        method: "POST",
        body: JSON.stringify({ amount: Number(codeAmount), count: Number(codeCount) }),
      });
      setGeneratedCodes(res.codes);
      setNotice(`Created ${res.codes.length} code(s).`);
      await loadStats();
    } catch (e: any) {
      setError(e?.message || "Failed.");
    } finally {
      setBusy(false);
    }
  }

  const statCards: { label: string; value: string; icon: string }[] = stats
    ? [
        { label: "Users", value: formatCount(stats.users), icon: "users" },
        { label: "Characters", value: formatCount(stats.characters), icon: "characters" },
        { label: "Worlds", value: formatCount(stats.worlds), icon: "world" },
        { label: "Conversations", value: formatCount(stats.conversations), icon: "chat" },
        { label: "Messages", value: formatCount(stats.messages), icon: "chat" },
        { label: "Memories", value: formatCount(stats.memories), icon: "sparkle" },
        { label: "Points in circulation", value: formatCount(stats.pointsInCirculation), icon: "coins" },
        { label: "Admins", value: formatCount(stats.admins), icon: "profile" },
      ]
    : [];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-16 pt-8">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Full control over users, points, and the platform."
          icon="settings"
        />

        {(notice || error) && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm ${
              error ? "bg-danger/10 border border-danger/30 text-danger" : "bg-success/10 border border-success/30 text-success"
            }`}
          >
            {error || notice}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-2 text-text-faint text-xs mb-1">
                <Icon name={s.icon} className="w-4 h-4" />
                {s.label}
              </div>
              <div className="font-display text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Users */}
          <section className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold">Users</h2>
              <div className="flex gap-2">
                <input
                  className="input !py-1.5 text-sm max-w-[200px]"
                  placeholder="Search…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadUsers(query)}
                />
                <button className="btn-ghost !py-1.5 text-sm" onClick={() => loadUsers(query)}>
                  Search
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {users.map((u) => (
                <UserRow key={u.id} u={u} selfId={user.id} busy={busy} onAct={act} />
              ))}
              {users.length === 0 && (
                <p className="text-sm text-text-faint py-8 text-center">No users found.</p>
              )}
            </div>
          </section>

          {/* Right column: codes + audit */}
          <div className="space-y-6">
            <section className="card p-5">
              <h2 className="font-display font-bold mb-1">Create redeem codes</h2>
              <p className="text-xs text-text-faint mb-4">
                Generate codes users can redeem on the Points page.
              </p>
              <div className="flex gap-3 items-end">
                <div>
                  <label className="label">Amount per code</label>
                  <input
                    className="input"
                    type="number"
                    value={codeAmount}
                    onChange={(e) => setCodeAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Count (max 50)</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={50}
                    value={codeCount}
                    onChange={(e) => setCodeCount(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={createCodes} disabled={busy}>
                  Generate
                </button>
              </div>
              {generatedCodes.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-bg-soft border border-border">
                  <div className="text-xs text-text-dim mb-2">Copy these codes:</div>
                  <div className="flex flex-wrap gap-2">
                    {generatedCodes.map((c) => (
                      <code key={c} className="chip font-mono">{c}</code>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="card p-5">
              <h2 className="font-display font-bold mb-3">Recent admin activity</h2>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {audit.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0">
                      <span className="text-accent-soft font-medium">{a.action}</span>
                      <span className="text-text-dim"> by {a.adminUsername}</span>
                      {a.targetUsername && (
                        <span className="text-text-faint"> → {a.targetUsername}</span>
                      )}
                      {a.detail && <span className="text-text-faint"> ({a.detail})</span>}
                    </div>
                    <span className="text-text-faint shrink-0">{a.createdAt.slice(0, 16).replace("T", " ")}</span>
                  </div>
                ))}
                {audit.length === 0 && (
                  <p className="text-sm text-text-faint py-6 text-center">No admin activity yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function UserRow({
  u,
  selfId,
  busy,
  onAct,
}: {
  u: AdminUser;
  selfId: string;
  busy: boolean;
  onAct: (id: string, action: string, payload: Record<string, unknown>) => void;
}) {
  const [amount, setAmount] = useState("1000");
  const [mode, setMode] = useState<"grant" | "setBalance">("grant");
  const isSelf = u.id === selfId;

  return (
    <div className="rounded-xl border border-border bg-bg-soft/50 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{u.username}</span>
            {u.isAdmin && <span className="chip">admin</span>}
            {u.banned && <span className="badge bg-danger/20 text-danger">banned</span>}
            {isSelf && <span className="badge bg-accent/20 text-accent-soft">you</span>}
          </div>
          <div className="text-[11px] text-text-faint truncate">{u.email}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-accent-amber tabular-nums">{u.balance}</div>
          <div className="text-[10px] text-text-faint">points</div>
        </div>
      </div>

      <div className="text-[10px] text-text-faint mb-2">
        {u.messageCount} msgs · {u.conversationCount} chats · joined {u.createdAt.slice(0, 10)}
      </div>

      {/* Points controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input !w-auto !py-1 text-xs"
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
        >
          <option value="grant">Grant</option>
          <option value="setBalance">Set balance</option>
        </select>
        <input
          className="input !w-24 !py-1 text-xs"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="btn-primary !py-1 text-xs"
          disabled={busy}
          onClick={() => {
            if (mode === "grant") {
              const a = Math.floor(Number(amount));
              onAct(u.id, a >= 0 ? "grant" : "deduct", { amount: a, note: "Admin grant" });
            } else {
              onAct(u.id, "setBalance", { balance: Math.floor(Number(amount)) });
            }
          }}
        >
          Apply
        </button>
      </div>

      {/* Mod controls */}
      <div className="flex flex-wrap gap-2 mt-2">
        {!u.isAdmin ? (
          <button className="btn-ghost !py-1 text-xs" disabled={busy} onClick={() => onAct(u.id, "setRole", { isAdmin: true })}>
            Make admin
          </button>
        ) : (
          !isSelf && (
            <button className="btn-ghost !py-1 text-xs" disabled={busy} onClick={() => onAct(u.id, "setRole", { isAdmin: false })}>
              Remove admin
            </button>
          )
        )}
        {!isSelf && (
          u.banned ? (
            <button className="btn-ghost !py-1 text-xs" disabled={busy} onClick={() => onAct(u.id, "setBanned", { banned: false })}>
              Unban
            </button>
          ) : (
            <button className="btn-ghost !py-1 !text-danger !border-danger/40 text-xs" disabled={busy} onClick={() => onAct(u.id, "setBanned", { banned: true })}>
              Ban
            </button>
          )
        )}
      </div>
    </div>
  );
}
