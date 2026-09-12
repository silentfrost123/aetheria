"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { usePoints } from "@/lib/points-context";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";
import { AuthGate } from "@/components/ui";

interface Tx {
  id: string;
  amount: number;
  kind: string;
  note: string;
  createdAt: string;
}

const KIND_LABELS: Record<string, string> = {
  daily: "Daily bonus",
  message: "Message",
  regenerate: "Regenerate",
  swipe: "Swipe",
  redeem: "Redeemed code",
  purchase: "Purchase",
  admin: "Granted",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PointsPage() {
  const { user } = useAuth();
  const { balance, canClaim, config, refresh, claimDaily, redeem } = usePoints();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ transactions: Tx[] }>("/api/points")
      .then((d) => setTransactions(d.transactions))
      .catch(() => {});
  }, [user, balance]);

  async function onClaim() {
    setClaiming(true);
    try {
      await claimDaily();
    } finally {
      setClaiming(false);
    }
  }

  async function onRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setRedeeming(true);
    setRedeemMsg(null);
    const r = await redeem(code);
    setRedeeming(false);
    if (r.ok) {
      setRedeemMsg({ ok: true, text: `+${r.amount} points added!` });
      setCode("");
    } else {
      setRedeemMsg({ ok: false, text: r.error || "Couldn't redeem that code." });
    }
  }

  if (!user) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-10">
          <AuthGate
            title="Join Aetheria for points"
            description="Earn 500 free points every day to chat with characters, and buy more when you run out."
          />
        </div>
      </AppShell>
    );
  }

  const dailyMessages = Math.floor(balance / (config.messageCost || 1));

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-16">
        <div className="pt-8 pb-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Points</h1>
          <p className="text-text-dim mt-1.5 text-sm md:text-base">
            Your balance for chatting with AI characters.
          </p>
        </div>

        {/* Balance hero */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-bg-soft p-6 md:p-8">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-widest text-text-faint mb-1">
                Current balance
              </div>
              <div className="flex items-center gap-3">
                <Icon name="coins" className="w-8 h-8 text-accent-amber" />
                <span className="font-display text-5xl font-bold tabular-nums">{balance}</span>
              </div>
              <div className="text-sm text-text-dim mt-2">
                ≈ {dailyMessages} message{dailyMessages === 1 ? "" : "s"} at {config.messageCost} points each
              </div>
            </div>

            <button
              onClick={onClaim}
              disabled={claiming || !canClaim}
              className={`btn-primary text-base ${
                !canClaim ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <Icon name="spark" className="w-4 h-4" />
              {canClaim
                ? claiming
                  ? "Claiming…"
                  : `Claim ${config.dailyPoints} daily points`
                : "Daily bonus claimed"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {/* Buy points */}
          <div className="md:col-span-2">
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold mb-1">Get more points</h2>
              <p className="text-sm text-text-dim mb-5">
                Run out? Buy points to keep the story going.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { amount: 1000, price: "$1.99" },
                  { amount: 5000, price: "$7.99" },
                  { amount: 12000, price: "$15.99" },
                ].map((p) => (
                  <button
                    key={p.amount}
                    onClick={() => {
                      // Placeholder — wire to your payment provider (Stripe, etc.)
                      setRedeemMsg({
                        ok: false,
                        text: "Payments aren't enabled yet. Redeem a code below instead.",
                      });
                    }}
                    className="card-interactive p-4 text-center group"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-accent-amber mb-1">
                      <Icon name="coins" className="w-4 h-4" />
                      <span className="font-display text-2xl font-bold tabular-nums">
                        {p.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-text">{p.price}</div>
                    <div className="text-[11px] text-text-faint mt-0.5 group-hover:text-accent-soft transition-colors">
                      Buy now
                    </div>
                  </button>
                ))}
              </div>

              {/* Redeem code */}
              <div className="border-t border-border-soft pt-5">
                <div className="text-sm font-semibold mb-2">Have a code?</div>
                <form onSubmit={onRedeem} className="flex gap-2">
                  <input
                    className="input uppercase tracking-widest"
                    placeholder="ENTER CODE"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    aria-label="Redeem code"
                  />
                  <button type="submit" disabled={redeeming || !code.trim()} className="btn-ghost whitespace-nowrap">
                    {redeeming ? "…" : "Redeem"}
                  </button>
                </form>
                {redeemMsg && (
                  <p className={`text-sm mt-2 ${redeemMsg.ok ? "text-success" : "text-danger"}`}>
                    {redeemMsg.text}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="spark" className="w-4 h-4 text-accent-soft" />
                <span className="text-sm font-semibold">How it works</span>
              </div>
              <ul className="space-y-2 text-sm text-text-dim">
                <li className="flex justify-between">
                  <span>Daily bonus</span>
                  <span className="text-accent-amber font-semibold">+{config.dailyPoints}</span>
                </li>
                <li className="flex justify-between">
                  <span>Per AI message</span>
                  <span className="text-danger font-semibold">-{config.messageCost}</span>
                </li>
                <li className="flex justify-between">
                  <span>Regenerate / swipe</span>
                  <span className="text-danger font-semibold">-{config.messageCost}</span>
                </li>
              </ul>
              <p className="text-[11px] text-text-faint mt-3 leading-relaxed">
                Commands like /roll and /status are free. Every AI reply costs {config.messageCost}{" "}
                points.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold mb-4">History</h2>
          {transactions.length === 0 ? (
            <div className="card p-8 text-center text-sm text-text-dim">
              No transactions yet. Claim your daily bonus to get started.
            </div>
          ) : (
            <div className="card divide-y divide-border-soft">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-4 py-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      t.amount > 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}
                  >
                    <Icon name={t.amount > 0 ? "plus" : "send"} className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {KIND_LABELS[t.kind] || t.kind}
                    </div>
                    <div className="text-[11px] text-text-faint">{fmtDate(t.createdAt)}</div>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      t.amount > 0 ? "text-success" : "text-text-dim"
                    }`}
                  >
                    {t.amount > 0 ? `+${t.amount}` : t.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
