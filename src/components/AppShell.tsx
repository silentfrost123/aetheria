"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePoints } from "@/lib/points-context";
import { Icon } from "./icons";
import { CookieConsent } from "./CookieConsent";
import { FeedbackButton } from "./FeedbackButton";

type NavItem = { href: string; label: string; icon: string };

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/discover", label: "Discover", icon: "discover" },
  { href: "/chats", label: "Chats", icon: "chat" },
  { href: "/my-characters", label: "My characters", icon: "characters" },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/points", label: "Points", icon: "coins" },
  { href: "/following", label: "Following", icon: "following" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/discover", label: "Discover", icon: "discover" },
  { href: "/create", label: "Create", icon: "create" },
  { href: "/chats", label: "Chats", icon: "chat" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

function NavLink({
  item,
  active,
  collapsed,
  emphasize = false,
  badge,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  emphasize?: boolean;
  badge?: string;
}) {
  if (emphasize) {
    return (
      <Link
        href={item.href}
        className="flex items-center justify-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-accent to-accent-deep border border-accent-soft/40 shadow-glow-sm hover:brightness-110 transition-all"
        title={collapsed ? item.label : undefined}
      >
        <Icon name={item.icon} className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-accent/15 text-accent-soft shadow-glow-sm"
          : "text-text-dim hover:bg-white/5 hover:text-text"
      }`}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-accent-soft" />
      )}
      <Icon name={item.icon} className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && badge && (
        <span className="text-xs font-semibold text-accent-amber tabular-nums">{badge}</span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer with the Escape key (keyboard accessibility).
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const pathname = usePathname();
  const { user } = useAuth();
  const { balance } = usePoints();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-bg relative">
      {/* Skip link — first tab stop for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-bg-panel focus:text-text focus:outline-none"
      >
        Skip to content
      </a>
      {/* Ambient aurora background */}
      <div className="aurora" aria-hidden="true">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:flex flex-col border-r border-border-soft bg-bg-soft/80 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? "w-[80px]" : "w-[248px]"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border-soft">
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Chatworld home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center shadow-glow-sm">
              <Icon name="spark" className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-lg tracking-tight">Chatworld</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* Primary */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-faint">
                Explore
              </div>
            )}
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
            ))}

            {/* Create — emphasized CTA */}
            <div className="pt-2">
              <NavLink
                item={{ href: "/create", label: "Create", icon: "create" }}
                active={isActive("/create")}
                collapsed={collapsed}
                emphasize
              />
            </div>
          </div>

          {/* Secondary */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-faint">
                You
              </div>
            )}
            {SECONDARY_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                badge={item.href === "/points" && user ? String(balance) : undefined}
              />
            ))}
            {user?.isAdmin && (
              <NavLink
                item={{ href: "/admin", label: "Admin", icon: "settings" }}
                active={isActive("/admin")}
                collapsed={collapsed}
              />
            )}
          </div>
        </nav>

        <div className="p-3 border-t border-border-soft">
          {user ? (
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.username[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{user.username}</div>
                  <div className="text-xs text-text-faint capitalize">{user.plan}</div>
                </div>
              )}
              {!collapsed && (
                <Link
                  href="/points"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent-amber bg-accent-amber/10 border border-accent-amber/20 rounded-full px-2 py-0.5 shrink-0"
                  title="Your points"
                >
                  <Icon name="coins" className="w-3.5 h-3.5" />
                  {balance}
                </Link>
              )}
            </Link>
          ) : (
            !collapsed && (
              <Link href="/auth" className="btn-primary w-full text-sm">
                Sign in
              </Link>
            )
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mt-2 w-full flex items-center justify-center rounded-lg py-1.5 text-text-faint hover:text-text hover:bg-white/5 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={collapsed ? "arrowRight" : "back"} className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 glass border-b border-border-soft flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Chatworld home">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center shadow-glow-sm">
            <Icon name="spark" className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Chatworld</span>
        </Link>
        <div className="flex items-center gap-1">
          {user && (
            <Link
              href="/points"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-amber bg-accent-amber/10 border border-accent-amber/20 rounded-full px-2 py-1"
              title="Your points"
            >
              <Icon name="coins" className="w-3.5 h-3.5" />
              {balance}
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-lg text-text-dim hover:text-text hover:bg-white/5 transition-colors"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-bg-soft border-r border-border-soft flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-border-soft shrink-0">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5"
                aria-label="Chatworld home"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center">
                  <Icon name="spark" className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-lg">Chatworld</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-lg text-text-dim hover:text-text hover:bg-white/5"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              <div className="space-y-1">
                <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-faint">
                  Explore
                </div>
                {PRIMARY_NAV.map((item) => (
                  <div key={item.href} onClick={() => setMenuOpen(false)}>
                    <NavLink item={item} active={isActive(item.href)} collapsed={false} />
                  </div>
                ))}
                <div className="pt-2" onClick={() => setMenuOpen(false)}>
                  <NavLink
                    item={{ href: "/create", label: "Create", icon: "create" }}
                    active={isActive("/create")}
                    collapsed={false}
                    emphasize
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-faint">
                  You
                </div>
                {SECONDARY_NAV.map((item) => (
                  <div key={item.href} onClick={() => setMenuOpen(false)}>
                    <NavLink
                      item={item}
                      active={isActive(item.href)}
                      collapsed={false}
                      badge={item.href === "/points" && user ? String(balance) : undefined}
                    />
                  </div>
                ))}
                {user?.isAdmin && (
                  <div onClick={() => setMenuOpen(false)}>
                    <NavLink
                      item={{ href: "/admin", label: "Admin", icon: "settings" }}
                      active={isActive("/admin")}
                      collapsed={false}
                    />
                  </div>
                )}
              </div>
            </nav>
            <div className="p-3 border-t border-border-soft shrink-0">
              {user ? (
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent flex items-center justify-center text-xs font-bold text-white">
                    {user.username[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{user.username}</div>
                    <div className="text-xs text-text-faint capitalize">{user.plan}</div>
                  </div>
                </Link>
              ) : (
                <Link href="/auth" onClick={() => setMenuOpen(false)} className="btn-primary w-full text-sm">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className={`relative z-10 transition-all duration-300 ${collapsed ? "md:pl-[80px]" : "md:pl-[248px]"}`}>
        <main id="main" tabIndex={-1} key={pathname} className="page-enter pt-14 md:pt-0 pb-24 md:pb-0 min-h-screen outline-none">{children}</main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border-soft pb-24 md:pb-0">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center">
                <Icon name="spark" className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-text-dim">© 2026 Chatworld. Every world begins with a first chapter.</span>
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
              <Link href="/" className="text-text-dim hover:text-text">Home</Link>
              <Link href="/discover" className="text-text-dim hover:text-text">Discover</Link>
              <Link href="/create" className="text-text-dim hover:text-text">Create</Link>
              <Link href="/my-characters" className="text-text-dim hover:text-text">My characters</Link>
              <Link href="/points" className="text-text-dim hover:text-text">Points</Link>
              <Link href="/settings" className="text-text-dim hover:text-text">Settings</Link>
            </nav>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-faint" aria-label="Legal">
              <Link href="/legal/privacy" className="hover:text-text-dim">Privacy Policy</Link>
              <Link href="/legal/terms" className="hover:text-text-dim">Terms of Service</Link>
              <Link href="/legal/refund" className="hover:text-text-dim">Refund Policy</Link>
              <Link href="/legal/cookies" className="hover:text-text-dim">Cookie Policy</Link>
              <FeedbackButton className="hover:text-text-dim" />
            </nav>
          </div>
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border-soft flex items-stretch justify-around"
        aria-label="Primary navigation"
      >
        {MOBILE_NAV.map((item) => {
          const active = isActive(item.href);
          const isCreate = item.href === "/create";
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2.5 px-2 text-[10px] font-medium transition-colors ${
                active ? "text-accent-soft" : "text-text-faint"
              }`}
            >
              {isCreate ? (
                <span className="w-9 h-9 -mt-2 rounded-full bg-gradient-to-br from-accent to-accent-deep flex items-center justify-center shadow-glow-sm">
                  <Icon name="create" className="w-5 h-5 text-white" />
                </span>
              ) : (
                <Icon name={item.icon} className="w-5 h-5" />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <CookieConsent />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 font-display text-2xl md:text-3xl font-bold tracking-tight">
          {icon && <Icon name={icon} className="w-6 h-6 text-accent-soft" />}
          {title}
        </h1>
        {subtitle && <p className="text-text-dim mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
