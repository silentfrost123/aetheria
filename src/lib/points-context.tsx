"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { apiFetch } from "./api";

export interface PointsConfig {
  dailyPoints: number;
  messageCost: number;
}

interface PointsContextValue {
  balance: number;
  loading: boolean;
  canClaim: boolean;
  config: PointsConfig;
  refresh: () => Promise<void>;
  claimDaily: () => Promise<{ claimed: boolean; amount: number; balance: number }>;
  redeem: (code: string) => Promise<{ ok: boolean; amount?: number; error?: string }>;
}

const PointsContext = createContext<PointsContextValue | null>(null);

const DEFAULT_CONFIG: PointsConfig = { dailyPoints: 500, messageCost: 50 };

export function PointsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canClaim, setCanClaim] = useState(false);
  const [config, setConfig] = useState<PointsConfig>(DEFAULT_CONFIG);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }
    try {
      const d = await apiFetch<{
        balance: number;
        canClaim: boolean;
        config: PointsConfig;
      }>("/api/points");
      setBalance(d.balance);
      setCanClaim(d.canClaim);
      setConfig(d.config);
    } catch {
      /* ignore — keep last known */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const claimDaily = useCallback(async () => {
    const d = await apiFetch<{ claimed: boolean; amount: number; balance: number }>(
      "/api/points/claim",
      { method: "POST" }
    );
    setBalance(d.balance);
    setCanClaim(false);
    return d;
  }, []);

  const redeem = useCallback(
    async (code: string) => {
      const d = await apiFetch<{ ok: boolean; amount?: number; balance: number; error?: string }>(
        "/api/points/redeem",
        { method: "POST", body: JSON.stringify({ code }) }
      );
      setBalance(d.balance);
      return d;
    },
    []
  );

  return (
    <PointsContext.Provider
      value={{ balance, loading, canClaim, config, refresh, claimDaily, redeem }}
    >
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints must be used within PointsProvider");
  return ctx;
}
