"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "./icons";

const NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/discover", label: "Discover", icon: "discover" },
  { href: "/characters", label: "Characters", icon: "characters" },
  { href: "/stories", label: "Stories", icon: "story" },
  { href: "/worlds", label: "Worlds", icon: "world" },
  { href: "/create", label: "Create", icon: "create" },
  { href: "/chats", label: "Chats", icon: "chat" },
  { href: "/library", label: "Library", icon: "library" },
  { href: "/following", label: "Following", icon: "following" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/discover", label: "Discover", icon: "discover" },
  { href: "/create", label: "Create", icon: "create" },
  { href: "/chats", label: "Chats", icon: "chat" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden md:flex flex-col border-r border-border-soft bg-bg-soft/80 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? "w-[76px]" : "w-[236px]"
        }`}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border-soft">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center shrink-0">
            <Icon name="spark" className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <Link href="/" className="font-display font-bold text-lg tracking-tight">
              Aetheria
            </Link>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/15 text-accent-soft"
                    : "text-text-dim hover:bg-white/5 hover:text-text"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
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
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{user.username}</div>
                  <div className="text-xs text-text-faint capitalize">{user.plan}</div>
                </div>
              )}
            </Link>
          ) : (
            !collapsed && (
              <Link href="/auth" className="btn-primary w-full text-center block text-sm">
                Sign in
              </Link>
            )
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mt-2 w-full flex items-center justify-center rounded-lg py-1.5 text-text-faint hover:text-text hover:bg-white/5 transition-colors"
            title="Toggle sidebar"
          >
            <Icon name={collapsed ? "arrowRight" : "back"} className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`transition-all duration-300 ${collapsed ? "md:pl-[76px]" : "md:pl-[236px]"}`}>
        <main className="pb-20 md:pb-0 min-h-screen">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border-soft flex items-stretch justify-around">
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 text-[10px] font-medium ${
                active ? "text-accent-soft" : "text-text-faint"
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5" />
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
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-text-dim mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
