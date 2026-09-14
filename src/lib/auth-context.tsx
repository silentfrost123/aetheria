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
  enterAsGuest: () => Promise<ApiUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Signed-out visitors stay signed out: browsing is open to everyone,
    // and a guest session is only created when the user explicitly chooses
    // "Continue as guest" (enterAsGuest) at the moment they want to chat.
    try {
      const data = await apiFetch<{ user: ApiUser | null }>("/api/auth/me");
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enterAsGuest = useCallback(async (): Promise<ApiUser> => {
    const g = await apiFetch<{ user: ApiUser; token: string }>("/api/auth/guest", {
      method: "POST",
    });
    if (g.token) setToken(g.token);
    setUser(g.user);
    return g.user;
  }, []);

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

  const deleteAccount = useCallback(async () => {
    await apiFetch("/api/auth/me", { method: "DELETE" });
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, enterAsGuest, logout, refresh, updateSettings, deleteAccount }}
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
