"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePoints } from "@/lib/points-context";
import { Icon } from "./icons";

type NavItem = { href: string; label: string; icon: string };

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/discover", label: "Discover", icon: "discover" },
  { href: "/chats", label: "Chats", icon: "chat" },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/points", label: "Points", icon: "coins" },
  { href: "/library", label: "Library", icon: "library" },
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
          ? "bg-accent/15 text-accent-soft"
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
  const pathname = usePathname();
  const { user } = useAuth();
  const { balance } = usePoints();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:flex flex-col border-r border-border-soft bg-bg-soft/80 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? "w-[80px]" : "w-[248px]"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border-soft">
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Aetheria home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center shadow-glow-sm">
              <Icon name="spark" className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-lg tracking-tight">Aetheria</span>
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

      {/* Main */}
      <div className={`transition-all duration-300 ${collapsed ? "md:pl-[80px]" : "md:pl-[248px]"}`}>
        <main className="pb-24 md:pb-0 min-h-screen">{children}</main>
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
