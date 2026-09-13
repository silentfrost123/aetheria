"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useState, ReactNode } from "react";
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
/* Toasts — non-blocking feedback for every action                     */
/* ------------------------------------------------------------------ */
type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}
const ToastCtx = createContext<{ toast: (message: string, kind?: ToastKind) => void } | null>(
  null
);

let toastSeq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = toastSeq++;
    setToasts((t) => [...t.slice(-3), { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const kindStyles: Record<ToastKind, string> = {
    success: "border-success/40 text-success",
    error: "border-danger/40 text-danger",
    info: "border-accent/40 text-accent-soft",
  };
  const kindIcon: Record<ToastKind, string> = {
    success: "check",
    error: "alert",
    info: "spark",
  };

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 right-4 z-[80] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-bg-panel/95 backdrop-blur-xl shadow-glow px-3.5 py-3 ${kindStyles[t.kind]}`}
          >
            <Icon name={kindIcon[t.kind]} className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="text-sm text-text leading-snug">{t.message}</span>
            <button
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="ml-auto text-text-faint hover:text-text shrink-0"
              aria-label="Dismiss notification"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Confirm dialog — replaces window.confirm()                          */
/* ------------------------------------------------------------------ */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm p-6 toast-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {description && (
          <p className="text-sm text-text-dim mt-2 leading-relaxed">{description}</p>
        )}
        <div className="flex gap-3 mt-6">
          <button className="btn-ghost flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className={`flex-1 ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
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

/* ------------------------------------------------------------------ */
/* Toggle switch                                                       */
/* ------------------------------------------------------------------ */
export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 shrink-0 w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-bg-hover border border-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-text">{label}</span>}
          {description && (
            <span className="block text-xs text-text-faint mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Labeled slider                                                      */
/* ------------------------------------------------------------------ */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  label,
  hint,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  hint?: string;
  format?: (v: number) => string;
}) {
  return (
    <div>
      {label && (
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-sm font-medium text-text">{label}</span>
          <span className="text-xs text-accent-soft font-semibold tabular-nums">
            {format ? format(value) : value}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        aria-label={label}
      />
      {hint && <p className="text-[11px] text-text-faint mt-1">{hint}</p>}
    </div>
  );
}
