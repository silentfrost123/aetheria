"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Icon } from "./icons";

/* ------------------------------------------------------------------ */
/* Section header with optional "see all" link                        */
/* ------------------------------------------------------------------ */
export function SectionHeader({
  title,
  subtitle,
  icon,
  link,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  link?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-lg md:text-xl font-bold tracking-tight text-text">
          {icon && <Icon name={icon} className="w-5 h-5 text-accent-soft" />}
          {title}
        </h2>
        {subtitle && <p className="text-xs md:text-sm text-text-dim mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        {link && (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-soft hover:text-accent transition-colors"
          >
            {link.label}
            <Icon name="chevronRight" className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal scroll rail (scroll-snap, hide scrollbar)                */
/* ------------------------------------------------------------------ */
export function HScroll({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`hide-scrollbar flex gap-4 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented control / tabs                                            */
/* ------------------------------------------------------------------ */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { id: T; label: string; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 p-1 rounded-xl border border-border bg-bg-panel/70"
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all ${
              size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
            } ${
              active
                ? "bg-accent/15 text-accent-soft shadow-glow-sm"
                : "text-text-dim hover:text-text hover:bg-white/5"
            }`}
          >
            {o.icon && <Icon name={o.icon} className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter chip (toggleable)                                            */
/* ------------------------------------------------------------------ */
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-accent/15 border-accent/40 text-accent-soft"
          : "border-border text-text-dim hover:text-text hover:border-text-faint"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton card that matches a character card's dimensions            */
/* ------------------------------------------------------------------ */
export function CardSkeleton({ aspect = "aspect-[3/4]" }: { aspect?: string }) {
  return (
    <div className="shimmer rounded-2xl overflow-hidden">
      <div className={`${aspect} w-full`} />
      <div className="p-3 space-y-2">
        <div className="shimmer h-3 w-3/4 rounded-full" />
        <div className="shimmer h-3 w-full rounded-full" />
        <div className="shimmer h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

export function WideSkeleton({ h = "h-24" }: { h?: string }) {
  return <div className={`shimmer rounded-2xl ${h}`} />;
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */
export function EmptyState({
  icon = "sparkle",
  title,
  description,
  action,
  compact = false,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-10" : "py-16 md:py-24"}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
        <Icon name={icon} className="w-7 h-7 text-accent-soft" />
      </div>
      <h3 className="font-display text-lg font-bold text-text">{title}</h3>
      {description && (
        <p className="text-sm text-text-dim mt-1.5 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link href={action.href} className="btn-primary">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="btn-primary">
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error state                                                         */
/* ------------------------------------------------------------------ */
export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24">
      <div className="w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mb-4">
        <Icon name="compass" className="w-7 h-7 text-danger" />
      </div>
      <h3 className="font-display text-lg font-bold text-text">Something went wrong.</h3>
      <p className="text-sm text-text-dim mt-1.5 max-w-sm">
        We couldn&apos;t load this part of Aetheria.
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-5 inline-flex items-center gap-2">
          <Icon name="refresh" className="w-4 h-4" /> Try again
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Auth-gate panel (polished "join us" prompt)                         */
/* ------------------------------------------------------------------ */
export function AuthGate({
  title = "Join Aetheria",
  description = "Create characters, build worlds, save your adventures, and continue where you left off.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-bg-soft p-10 md:p-14 text-center">
      <div className="absolute inset-0 bg-hero-gradient opacity-80" />
      <div className="relative flex flex-col items-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center mb-5 shadow-glow">
          <Icon name="spark" className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-text-dim mt-3 leading-relaxed">{description}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-7">
          <Link href="/auth" className="btn-primary">
            Sign in
          </Link>
          <Link href="/auth?mode=register" className="btn-ghost">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Count formatter                                                     */
/* ------------------------------------------------------------------ */
export function formatCount(n?: number): string {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
