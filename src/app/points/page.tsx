"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { usePoints } from "@/lib/points-context";
import { apiFetch } from "@/lib/api";
import { Icon } from "@/components/icons";
import { AuthGate, useToast } from "@/components/ui";

interface BillingData {
  configured: boolean;
  plans: {
    id: string;
    code: string;
    name: string;
    priceCents: number;
    interval: string;
    features: Record<string, any>;
    blurb: string;
  }[];
  packages: { id: string; name: string; credits: number; priceCents: number }[];
  subscription: { planCode: string; status: string } | null;
}

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
  const { balance, canClaim, streak, config, claimDaily, redeem } = usePoints();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    apiFetch<BillingData>("/api/billing/plans")
      .then(setBilling)
      .catch(() => setBilling(null));
  }, [user]);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const co = qs.get("checkout");
    if (co === "success") toast("Payment received — your purchase is being fulfilled.", "success");
    if (co === "cancelled") toast("Checkout cancelled — nothing was charged.", "info");
  }, [toast]);

  async function buy(kind: "credits" | "subscription", refId: string) {
    setBuying(refId);
    try {
      const r = await apiFetch<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ kind, refId }),
      });
      if (r.url) window.location.href = r.url;
      else toast("Stripe returned no checkout URL.", "error");
    } catch (e: any) {
      toast(e?.message || "Couldn't start checkout.", "error");
    } finally {
      setBuying(null);
    }
  }

  useEffect(() => {
    if (!user) return;
    apiFetch<{ transactions: Tx[] }>("/api/points")
      .then((d) => setTransactions(d.transactions))
      .catch(() => {});
  }, [user, balance]);

  async function onClaim() {
    setClaiming(true);
    setClaimMsg(null);
    try {
      const r = await claimDaily();
      if (r.claimed) {
        setClaimMsg(
          r.bonus > 0
            ? `+${r.amount} claimed (${r.bonus} streak bonus) — ${r.streak}-day streak!`
            : `+${r.amount} claimed!`
        );
      }
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
              {streak > 0 && (
                <div className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-accent-amber bg-accent-amber/10 border border-accent-amber/20 rounded-full px-2.5 py-1">
                  🔥 {streak}-day streak
                </div>
              )}
              {claimMsg && (
                <div className="text-sm text-success mt-2">{claimMsg}</div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
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
                    : `Claim ${config.dailyPoints}${streak > 0 ? ` +${Math.min(streak, 10) * 25} bonus` : ""}`
                  : "Daily bonus claimed"}
              </button>
              <span className="text-[11px] text-text-faint">
                Claim daily to build a streak for bonus points.
              </span>
            </div>
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

              <div className="grid grid-cols-3 gap-3 mb-4">
                {(billing?.packages || []).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => buy("credits", p.id)}
                    disabled={buying !== null || !billing?.configured}
                    className="card-interactive p-4 text-center group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-accent-amber mb-1">
                      <Icon name="coins" className="w-4 h-4" />
                      <span className="font-display text-2xl font-bold tabular-nums">
                        {p.credits.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-text">
                      ${(p.priceCents / 100).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-text-faint mt-0.5 group-hover:text-accent-soft transition-colors">
                      {buying === p.id ? "Opening Stripe…" : "Buy now"}
                    </div>
                  </button>
                ))}
              </div>
              {billing && !billing.configured && (
                <p className="text-[11px] text-text-faint mb-2">
                  Card payments activate once Stripe keys are configured on this deployment
                  (STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET). Codes still work.
                </p>
              )}

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
                  <span>Streak bonus</span>
                  <span className="text-accent-amber font-semibold">+25/day (max +250)</span>
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
                points. Keep claiming daily to grow your streak and earn up to +250 bonus points.
              </p>
            </div>
          </div>
        </div>

        {/* Membership plans */}
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold mb-1">Membership</h2>
          <p className="text-sm text-text-dim mb-5">
            Upgrade for more personas and bonus points every day.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(billing?.plans || []).map((pl) => {
              const current = (user?.plan || "free") === pl.code;
              const subActive =
                billing?.subscription?.planCode === pl.code &&
                billing.subscription.status === "active";
              return (
                <div
                  key={pl.id}
                  className={`card p-5 flex flex-col ${
                    current ? "border-accent/50 shadow-glow-sm" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold">{pl.name}</span>
                    {current && (
                      <span className="chip text-[10px] bg-accent/15 border-accent/40 text-accent-soft">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold tabular-nums">
                    ${(pl.priceCents / 100).toFixed(0)}
                    <span className="text-xs text-text-faint font-normal">/{pl.interval}</span>
                  </div>
                  <p className="text-xs text-text-dim mt-2 leading-relaxed flex-1">{pl.blurb}</p>
                  <ul className="text-[11px] text-text-dim space-y-1 mt-3 mb-4">
                    {typeof pl.features.maxPersonas === "number" && (
                      <li>✦ {pl.features.maxPersonas} personas</li>
                    )}
                    {typeof pl.features.dailyBonus === "number" && pl.features.dailyBonus > 0 && (
                      <li>✦ +{pl.features.dailyBonus} daily bonus points</li>
                    )}
                  </ul>
                  {pl.priceCents > 0 ? (
                    <button
                      className={`w-full ${current && subActive ? "btn-ghost" : "btn-primary"}`}
                      disabled={buying !== null || !billing?.configured || (current && subActive)}
                      onClick={() => buy("subscription", pl.id)}
                    >
                      {buying === pl.id
                        ? "Opening Stripe…"
                        : current && subActive
                          ? "Active"
                          : "Upgrade"}
                    </button>
                  ) : (
                    <div className="text-center text-xs text-text-faint py-2">
                      Everyone starts here
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {billing && !billing.configured && (
            <p className="text-[11px] text-text-faint mt-3">
              Subscriptions activate once Stripe is configured — plans and prices shown are the
              live catalog stored in your database.
            </p>
          )}
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
