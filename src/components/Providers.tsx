"use client";

import { AuthProvider } from "@/lib/auth-context";
import { PointsProvider } from "@/lib/points-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PointsProvider>{children}</PointsProvider>
    </AuthProvider>
  );
}
