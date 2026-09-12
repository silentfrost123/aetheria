"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { PointsProvider } from "@/lib/points-context";

/** Applies appearance preferences (font scale, reduce motion) to <html>. */
function AppearanceApplier({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  useEffect(() => {
    const root = document.documentElement;
    const scale = user?.settings?.fontScale || "md";
    const sizes: Record<string, string> = { sm: "15px", md: "16px", lg: "18px" };
    root.style.fontSize = sizes[scale] || sizes.md;
    if (user?.settings?.reduceMotion) root.classList.add("reduce-motion");
    else root.classList.remove("reduce-motion");
  }, [user]);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PointsProvider>
        <AppearanceApplier>{children}</AppearanceApplier>
      </PointsProvider>
    </AuthProvider>
  );
}
