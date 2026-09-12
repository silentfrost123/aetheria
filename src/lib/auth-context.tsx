"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { apiFetch, ApiUser, setToken, clearToken } from "./api";

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    ageVerified: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: ApiUser | null }>("/api/auth/me");
      if (data.user) {
        setUser(data.user);
      } else {
        // No session (e.g. blocked cookies/storage in embedded previews).
        // Auto-provision a guest session so the app is immediately usable.
        const g = await apiFetch<{ user: ApiUser; token: string }>(
          "/api/auth/guest",
          { method: "POST" }
        );
        if (g.token) setToken(g.token);
        setUser(g.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ user: ApiUser; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string, ageVerified: boolean) => {
      const data = await apiFetch<{ user: ApiUser; token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, password, ageVerified }),
      });
      if (data.token) setToken(data.token);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
  }, []);

  const updateSettings = useCallback(
    async (settings: any) => {
      const data = await apiFetch<{ user: ApiUser }>("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({ settings }),
      });
      setUser(data.user);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh, updateSettings }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
