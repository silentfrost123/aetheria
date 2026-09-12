"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/icons";

export default function AuthPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, username, password, age);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center">
            <Icon name="spark" className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold">Aetheria</span>
        </div>
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-text-dim text-sm mb-6">
            {mode === "login"
              ? "Your worlds have been waiting for you."
              : "Enter a world that remembers you."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="label">Username</label>
                <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name in the story" required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
            </div>
            {mode === "register" && (
              <label className="flex items-center gap-2 text-sm text-text-dim">
                <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="accent-accent" />
                I am 18 or older
              </label>
            )}
            {error && <div className="text-sm text-danger">{error}</div>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-text-dim">
            {mode === "login" ? (
              <>New here?{" "}
                <button className="text-accent-soft hover:underline" onClick={() => setMode("register")}>Create an account</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button className="text-accent-soft hover:underline" onClick={() => setMode("login")}>Sign in</button>
              </>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-text-faint mt-4">
          Demo account: demo@aetheria.dev / password123
        </p>
      </div>
    </div>
  );
}
